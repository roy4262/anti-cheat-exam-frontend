import { BASE_URL } from "../../constants";

// Define interface for exam object
interface Exam {
  _id: string;
  [key: string]: any; // Allow for other properties
}

const getExam = async (examId: string, token: string) => {
  try {
    console.log(`Fetching exam ${examId} with token`);

    // Use the backend URL directly for server-side calls
    // We need to use an absolute URL for server-side rendering
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer
      ? `${BASE_URL}/exam/${examId}`
      : `/api/exam/${examId}`;

    console.log(`Using API URL: ${apiUrl} (${isServer ? 'server' : 'client'})`);

    // Get the exam data (the backend will create a session)
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    console.log('Response status:', res.status, res.statusText);

    // First try to get the response as text
    const textResponse = await res.text();
    console.log('Raw response length:', textResponse.length);

    if (textResponse.length === 0) {
      throw new Error('Empty response received from server');
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(textResponse);
      console.log('Response parsed successfully');
    } catch (jsonError) {
      console.error('Response is not valid JSON:', jsonError);
      console.error('Raw response:', textResponse);
      throw new Error('Invalid JSON response from server');
    }

    if (!res.ok) {
      throw new Error(data?.error?.message || data?.message || `Server error: ${res.status}`);
    }

    if (data.error) {
      throw new Error(data.error.message || 'Error retrieving exam');
    }

    // Check if exam exists in the response
    if (!data.exam && data.success) {
      // Try to find exam in data property
      if (data.data && data.data.exam) {
        console.log('Found exam in data.data.exam');
        const examData = data.data.exam;
        console.log('Exam questions:', examData.questions);
        console.log('Question count:', examData.questionCount);
        return examData;
      } else if (data.data && !Array.isArray(data.data)) {
        // The data itself might be the exam
        console.log('Using data.data as exam');
        const examData = data.data;
        console.log('Exam questions:', examData.questions);
        console.log('Question count:', examData.questionCount);
        return examData;
      }
      throw new Error('No exam data found in response');
    }

    const examData = data.exam || data;
    console.log('Returning exam data:', examData);
    console.log('Exam questions:', examData.questions);
    console.log('Question count:', examData.questionCount);
    console.log('Actual questions length:', examData.questions ? examData.questions.length : 0);

    return examData;
  } catch (e) {
    console.error('Error fetching exam:', e);
    throw e;
  }
};

// Legacy function for backward compatibility
const getAssignedExams = async (email: string, token: string) => {
  try {
    const res = await fetch(`${BASE_URL}/assignedExams/all?email=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response format from server');
    }

    if (!res.ok || data.err) {
      throw new Error(data.err || "Failed to get assigned exams from server!");
    }

    return data.exams;
  } catch (e) {
    console.error('Error fetching assigned exams:', e);
    throw e;
  }
};

// New function that uses email-based authentication
const getUserAssignedExams = async (token: string) => {
  try {
    if (!token) {
      console.error('No token provided for getUserAssignedExams');
      throw new Error('Authentication token is missing');
    }

    // Use the backend URL directly for server-side calls
    // We need to use an absolute URL for server-side rendering
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer
      ? `${BASE_URL}/user/assignedExams`
      : `/api/user/assignedExams`;

    console.log(`Fetching assigned exams from: ${apiUrl} (${isServer ? 'server' : 'client'})`);
    console.log('Using token:', token.substring(0, 10) + '...');
    console.log('BASE_URL is:', BASE_URL);

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    console.log('Response status:', res.status, res.statusText);

    // First try to get the response as text
    const textResponse = await res.text();
    console.log('Raw response length:', textResponse.length);

    if (textResponse.length === 0) {
      console.error('Empty response received from server');
      return [];
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(textResponse);
      console.log('Response parsed successfully:', data ? 'Data received' : 'No data');
    } catch (jsonError) {
      console.error('Response is not valid JSON:', jsonError);
      console.error('Raw response:', textResponse);
      throw new Error('Invalid JSON response from server');
    }

    if (!res.ok) {
      console.error('Server returned error status:', res.status);
      throw new Error(data?.message || data?.error || `Server error: ${res.status}`);
    }

    if (data.err) {
      console.error('Error in response data:', data.err);
      throw new Error(data.err);
    }

    // Check if exams property exists in data or data.data
    let exams = [];
    if (data.exams) {
      // Direct exams property
      exams = data.exams;
      console.log('Found exams directly in response');
    } else if (data.data && data.data.exams) {
      // Exams inside data property (from handleSuccess)
      exams = data.data.exams;
      console.log('Found exams inside data.data.exams');
    } else if (data.success) {
      console.warn('Response has success=true but no exams property found');
      // Check if the entire data object might be the exams array
      if (data.data && Array.isArray(data.data)) {
        console.log('Found array in data.data, using as exams');
        exams = data.data;
      }
    }

    console.log('Exams received:', exams.length);

    // Validate exam data
    const validExams = exams.filter((exam: any): exam is Exam => exam && typeof exam === 'object' && '_id' in exam);
    if (validExams.length < exams.length) {
      console.warn(`Filtered out ${exams.length - validExams.length} invalid exams`);
    }

    return validExams;
  } catch (e) {
    console.error('Error fetching assigned exams:', e);
    throw e;
  }
};

export { getExam, getAssignedExams, getUserAssignedExams };
