import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeResumeWithAI = async (resumeText, targetRole) => {

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0, 
      topK: 1,        
      topP: 0.1       
    }
  });

  const prompt = `
    You are an expert ATS and Career Coach.
    Analyze this resume for a target role of "${targetRole}".
    Return ONLY a JSON object with this exact structure:
    {
      "atsScore": 85,
      "keywordOptimization": ["missing_keyword_1"],
      "skillGapAnalysis": "Brief paragraph explaining missing skills.",
      "improvementSuggestions": ["Actionable tip 1"]
    }
    Resume Text: ${resumeText}
  `;

  try {
    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    
    rawText = rawText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(rawText);
  } catch (error) {
    console.error('Gemini API Error (Resume):', error);
    throw new Error('Failed to analyze resume via AI');
  }
};

export const generateReferralMessageWithAI = async (studentDetails, alumniDetails, opportunityDetails) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    Write a highly professional, concise message requesting a referral.
    Student: ${studentDetails}
    Alumni: ${alumniDetails}
    Target Role: ${opportunityDetails}
    Keep it under 150 words. Be polite.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API Error (Message):', error);
    throw new Error('Failed to generate referral message');
  }
};


export const generateCareerRoadmapWithAI = async (currentSkills, targetRole, targetCompany = "Any") => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    You are an expert Career Counselor.
    Create a highly structured career roadmap for a student.
    Student's Current Skills: ${currentSkills.join(', ')}
    Target Role: ${targetRole}
    Target Company: ${targetCompany}

    Return ONLY a JSON object with this exact structure:
    {
      "skillsToAcquire": ["Skill 1", "Skill 2"],
      "certifications": ["Recommended Cert 1", "Recommended Cert 2"],
      "timeline": [
        {
          "phase": "Months 1-3",
          "focus": "Core Fundamentals",
          "actionItems": ["Action 1", "Action 2"]
        },
        {
          "phase": "Months 4-6",
          "focus": "Advanced Concepts & Projects",
          "actionItems": ["Action 1", "Action 2"]
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini API Error (Roadmap):', error);
    throw new Error('Failed to generate career roadmap');
  }
};