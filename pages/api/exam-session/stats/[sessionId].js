import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { BASE_URL } from "../../../../constants";

export default async function handler(req, res) {
  try {
    // Get the session ID from the URL
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required"
      });
    }

    // Get the user's session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        message: "You must be signed in to access this endpoint"
      });
    }

    // Get the user's token
    const token = session.user.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing"
      });
    }

    console.log(`Fetching stats for exam session ${sessionId}`);

    // Call the backend API to get the session stats
    const response = await fetch(`${BASE_URL}/exam-session/stats/${sessionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    // Get the response as text first for debugging
    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response length: ${responseText.length}`);

    // Parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("Error parsing response:", error);
      console.error("Response text:", responseText);
      return res.status(500).json({
        success: false,
        message: "Error parsing response from server"
      });
    }

    // Check if the request was successful
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || "Error fetching session stats"
      });
    }

    // Log the data for debugging
    console.log("Session stats received:");
    if (data.data) {
      console.log(`- Tab Switch Count: ${data.data.tabSwitchCount}`);
      console.log(`- Face Detection Violations: ${data.data.faceDetectionViolations}`);
      
      if (data.data.faceDetectionStats) {
        console.log(`- Face Detection Stats: ${JSON.stringify(data.data.faceDetectionStats)}`);
      } else {
        console.log("- Face Detection Stats: Not available");
      }
    }

    // Return the data
    return res.status(200).json({
      success: true,
      data: data.data || data.stats
    });
  } catch (error) {
    console.error("Error in exam session stats API:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching session stats: " + error.message
    });
  }
}