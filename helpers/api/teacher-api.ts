import { BASE_URL } from "../../constants";

/**
 * Assigns an exam to a user
 * @param userId - The ID of the user to assign the exam to
 * @param examId - The ID of the exam to assign
 * @param token - Authentication token
 * @returns Promise with the result of the assignment
 */
const assignExamToUser = async (userId: string, examId: string, token: string) => {
  try {
    const res = await fetch(`${BASE_URL}/user/assignExam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        examId
      })
    });

    const data = await res.json();

    if (!res.ok || data.err) {
      throw new Error(data.err || "Failed to assign exam to user!");
    }

    return data;
  } catch (e) {
    console.error('Error assigning exam to user:', e);
    throw e;
  }
};

export { assignExamToUser };