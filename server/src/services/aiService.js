import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini occasionally returns transient errors (503 overloaded, 429 rate limit,
// or 5xx). Retry those a few times with exponential backoff + jitter before
// giving up. Non-transient errors (e.g. 400, 404) fail fast.
const isTransient = (err) => {
  const status = err?.status;
  return status === 503 || status === 429 || status === 500 || status === 502 || status === 504;
};

// Primary model, then a lighter fallback tried when the primary stays overloaded.
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

// Try each model in the chain, retrying transient errors (503/429/5xx) with
// exponential backoff before moving on to the next model. Non-transient errors
// (e.g. 400/404) fail fast without wasting fallbacks. `modelOptions` carries the
// per-call generationConfig; this helper supplies the model name.
const generateWithFallback = async (
  modelOptions,
  prompt,
  { models = MODEL_CHAIN, retries = 2, baseDelay = 800 } = {}
) => {
  let lastError;
  for (const modelName of models) {
    const model = genAI.getGenerativeModel({ ...modelOptions, model: modelName });
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await model.generateContent(prompt);
      } catch (error) {
        lastError = error;
        if (!isTransient(error)) throw error; // hard failure — don't burn fallbacks
        if (attempt < retries) {
          const delay = baseDelay * 2 ** attempt + Math.floor(Math.random() * 300);
          console.warn(`Gemini ${modelName} transient (${error.status}). Retry ${attempt + 1}/${retries} in ${delay}ms.`);
          await sleep(delay);
        }
      }
    }
    console.warn(`Gemini ${modelName} still failing — falling back to next model.`);
  }
  throw lastError;
};

export const analyzeResumeWithAI = async (resumeText, targetRole) => {

  const modelOptions = {
    generationConfig: {
      temperature: 0,
      topK: 1,
      topP: 0.1
    }
  };

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
    const result = await generateWithFallback(modelOptions, prompt);
    let rawText = result.response.text();
    
    rawText = rawText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(rawText);
  } catch (error) {
    console.error('Gemini API Error (Resume):', error);
    throw new Error('Failed to analyze resume via AI');
  }
};

const MESSAGE_BRIEFS = {
  referral: `Write a highly professional, concise message from the student requesting a referral for the role.
    Be polite and specific about why they're a good fit. Keep it under 150 words.`,
  connection: `Write a short, warm professional connection request note (the kind sent with a LinkedIn connection).
    The student is introducing themselves to the alumnus. Mention the shared college connection and genuine
    interest in their work or path. Do NOT ask for a referral yet — the goal is only to connect. Keep it under 75 words.`,
  followup: `Write a polite, professional follow-up message from the student to an alumnus who has not yet responded
    to an earlier referral request. Gently reference the previous outreach, reaffirm genuine interest in the role,
    and keep it gracious and low-pressure — never pushy. Keep it under 120 words.`,
};

export const generateReferralMessageWithAI = async (
  studentDetails,
  alumniDetails,
  opportunityDetails,
  messageType = 'referral'
) => {
  const brief = MESSAGE_BRIEFS[messageType] || MESSAGE_BRIEFS.referral;

  const prompt = `
    ${brief}

    Student: ${studentDetails}
    Alumnus: ${alumniDetails}
    Target Role: ${opportunityDetails}

    Return ONLY the message body — no subject line, no greeting placeholders like "[Name]",
    no preamble, and no explanation.
  `;

  try {
    const result = await generateWithFallback({}, prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini API Error (Message):', error);
    throw new Error('Failed to generate message');
  }
};


export const generateCareerRoadmapWithAI = async (currentSkills = [], targetRole, targetCompany = "Any") => {
  const modelOptions = {
    generationConfig: { responseMimeType: "application/json", temperature: 0.4 }
  };

  const prompt = `
    You are an expert career counselor and industry mentor.
    Build a personalized, actionable career plan for a college student.

    Student's current skills: ${currentSkills.length ? currentSkills.join(', ') : 'None listed yet'}
    Target role: ${targetRole}
    Target company: ${targetCompany}

    Tailor every recommendation to the target role and company. Prioritise the skill
    gaps between the student's current skills and what the target requires.
    Do NOT invent or include any URLs.

    Return ONLY a JSON object with this exact structure:
    {
      "summary": "2-3 sentence personalized overview of the path from their current skills to the target role.",
      "skillsToAcquire": [
        { "skill": "Skill name", "reason": "Why it matters for this role/company", "priority": "High" }
      ],
      "certifications": [
        { "name": "Certification name", "provider": "Issuing organization" }
      ],
      "learningResources": [
        { "title": "Resource name", "type": "Course", "provider": "Platform or author" }
      ],
      "projectSuggestions": [
        { "title": "Project idea", "description": "1-2 sentences on what to build and how it maps to the target role", "skills": ["Skill 1", "Skill 2"] }
      ],
      "timeline": [
        { "phase": "Months 1-3", "focus": "Theme for this phase", "actionItems": ["Action 1", "Action 2"] }
      ]
    }

    Rules:
    - "priority" must be exactly "High", "Medium", or "Low".
    - "type" must be one of "Course", "Book", "Documentation", "Video", "Practice".
    - Provide 4-6 skills, 2-4 certifications, 3-5 learning resources, 2-3 projects, and 3-4 timeline phases.
  `;

  try {
    const result = await generateWithFallback(modelOptions, prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini API Error (Roadmap):', error);
    if (isTransient(error)) {
      throw new Error('The AI service is busy right now. Please try again in a moment.');
    }
    throw new Error('Failed to generate career roadmap');
  }
};


// Generate a role/company-tailored interview prep pack for a student.
export const generateInterviewPrepWithAI = async ({ targetRole, targetCompany = 'Any', skills = [], experienceLevel = 'Entry-level' }) => {
  const modelOptions = { generationConfig: { responseMimeType: 'application/json', temperature: 0.5 } };

  const prompt = `
    You are an experienced technical interviewer and career coach.
    Prepare a college student for interviews for the role below. Tailor the questions and
    emphasis to the role, company, and the student's skills.

    Target role: ${targetRole}
    Target company: ${targetCompany}
    Experience level: ${experienceLevel}
    Student's skills: ${skills.length ? skills.join(', ') : 'Not specified'}

    Return ONLY a JSON object with this exact structure:
    {
      "overview": "2-3 sentence preparation strategy for this specific role and company.",
      "rounds": [
        {
          "name": "Technical",
          "focus": "what this round evaluates",
          "questions": [
            { "question": "the interview question", "difficulty": "Medium", "tip": "what the interviewer looks for and how to approach it" }
          ]
        }
      ],
      "tips": ["actionable preparation tip"]
    }

    Rules:
    - "difficulty" must be exactly "Easy", "Medium", or "Hard".
    - Include 3-4 relevant rounds (choose from Technical, Problem Solving / DSA, System / Domain Design, Behavioral, HR).
    - 3-5 questions per round, and 4-6 overall tips. Do NOT include any URLs.
  `;

  try {
    const result = await generateWithFallback(modelOptions, prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini API Error (Interview):', error);
    if (isTransient(error)) throw new Error('The AI service is busy right now. Please try again in a moment.');
    throw new Error('Failed to generate interview preparation');
  }
};

// Turn a computed analytics payload into a few plain-English, data-grounded insights.
export const generateAnalyticsInsightsWithAI = async (analytics) => {
  const modelOptions = { generationConfig: { responseMimeType: 'application/json', temperature: 0.3 } };

  // Send a compact summary so the model stays grounded in the real numbers
  const summary = {
    kpis: analytics.kpis,
    referral: { rate: analytics.referral.acceptanceRate, byStatus: analytics.referral.byStatus, byMonth: analytics.referral.byMonth, topCompanies: analytics.referral.topCompanies },
    placement: { rate: analytics.placement.rate, byMonth: analytics.placement.byMonth, byDepartment: analytics.placement.byDepartment },
    skills: { mostDemanded: analytics.skills.mostDemanded, gap: analytics.skills.gap },
    jobs: { byType: analytics.jobs.byType, byMonth: analytics.jobs.byMonth },
    salary: { avg: analytics.salary.avg, byCompany: analytics.salary.byCompany },
  };

  const prompt = `
    You are a placement-cell data analyst for a college. Based ONLY on the JSON metrics below,
    write 4-6 short, specific, decision-useful insights. Reference concrete numbers/trends from the data.
    Do NOT invent data that isn't present. If data is sparse, say so plainly.

    Return ONLY JSON: { "insights": [ { "text": "one concise insight sentence", "sentiment": "up" } ] }
    "sentiment" must be one of "up", "down", or "neutral".

    METRICS:
    ${JSON.stringify(summary)}
  `;

  try {
    const result = await generateWithFallback(modelOptions, prompt);
    const parsed = JSON.parse(result.response.text());
    return parsed.insights || [];
  } catch (error) {
    console.error('Gemini API Error (Insights):', error);
    if (isTransient(error)) throw new Error('The AI service is busy right now. Please try again in a moment.');
    throw new Error('Failed to generate insights');
  }
};