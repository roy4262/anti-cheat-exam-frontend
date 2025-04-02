import {
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Typography,
} from "@mui/material";
import React from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { examActions } from "../../store/exam-store";
import classes from "./question-widget.module.scss";

interface QuestionWidgetProp {}

const QuestionWidget: React.FC<QuestionWidgetProp> = () => {
  const dispatch = useAppDispatch();
  const activeExam = useAppSelector((state) => state.exam.activeExam);
  const currentQuestion = useAppSelector(
    (state) => state.exam.activeExam.currentQuestion
  );

  console.log('Active exam:', activeExam);

  if (!activeExam) {
    console.error('No active exam found in store');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Exam data is not available</h3>
        <p>Please try refreshing the page or return to the dashboard.</p>
      </div>
    );
  }

  if (!activeExam.exam) {
    console.error('Active exam has no exam property');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Exam data is incomplete</h3>
        <p>Please try refreshing the page or return to the dashboard.</p>
      </div>
    );
  }

  if (!activeExam.exam.questions) {
    console.error('No questions array found in exam');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>No questions available for this exam</h3>
        <p>This exam may not have any questions configured.</p>
      </div>
    );
  }

  const {
    exam: { questions, questionCount },
    answerKeys,
  } = activeExam;

  console.log(`Current question: ${currentQuestion + 1}/${questions.length}`);
  console.log(`Question count from exam: ${questionCount}`);
  console.log('Questions array:', questions);

  // Check if the current question index is valid
  if (currentQuestion < 0 || currentQuestion >= questions.length) {
    console.error(`Invalid question index: ${currentQuestion}, total questions: ${questions.length}`);
    return <p>Question not found! Please try another question.</p>;
  }

  const question = questions[currentQuestion];

  // Additional safety check
  if (!question) {
    console.error(`Question at index ${currentQuestion} is undefined`);
    return <p>Question data is missing! Please try another question.</p>;
  }

  console.log('Current question data:', question);

  const onAnswerChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    val: string
  ) => {
    dispatch(
      examActions.setAnswer({ questionNo: currentQuestion, answerKey: val })
    );
  };

  // Get the question text, with fallbacks
  const questionText = question.text || question.question || question.title || `Question ${currentQuestion + 1}`;

  // Check if options exist and normalize them
  let hasOptions = false;
  try {
    if (question.options) {
      if (Array.isArray(question.options)) {
        hasOptions = question.options.length > 0;
      } else if (typeof question.options === 'object') {
        hasOptions = Object.keys(question.options).length > 0;
      }
    }
  } catch (e) {
    console.error('Error checking question options:', e);
  }

  return (
    <div className={classes.questionWidget}>
      <Typography
        className={classes.question}
        sx={{
          marginBottom: "2rem",
        }}
      >
        {`${currentQuestion + 1}. ${questionText}`}
      </Typography>

      <div className={classes.optionsGroup}>
        {!hasOptions ? (
          <Typography color="error">
            No options available for this question.
          </Typography>
        ) : (
          <FormControl>
            <RadioGroup
              value={answerKeys[currentQuestion]}
              onChange={onAnswerChange}
            >
              {(() => {
                try {
                  if (Array.isArray(question.options)) {
                    // Handle options as array
                    return question.options.map((option, index) => {
                      const optionText = typeof option === 'string' ? option :
                                        (option && typeof option === 'object' && option.text) ? option.text :
                                        `Option ${index + 1}`;

                      return (
                        <FormControlLabel
                          key={index}
                          value={index.toString()} // Use index as value for consistency
                          control={<Radio />}
                          label={optionText}
                        />
                      );
                    });
                  } else if (question.options && typeof question.options === 'object') {
                    // Handle options as object (legacy format)
                    return Object.entries(question.options).map(
                      ([option, label]) => {
                        const optionText = typeof label === 'string' ? label :
                                          (label && typeof label === 'object' && label.text) ? label.text :
                                          `Option ${option}`;

                        return (
                          <FormControlLabel
                            key={option}
                            value={option}
                            control={<Radio />}
                            label={optionText}
                          />
                        );
                      }
                    );
                  } else {
                    return <Typography color="error">Invalid options format</Typography>;
                  }
                } catch (e) {
                  console.error('Error rendering question options:', e);
                  return <Typography color="error">Error displaying options</Typography>;
                }
              })()}
            </RadioGroup>
          </FormControl>
        )}
      </div>
    </div>
  );
};

export default QuestionWidget;
