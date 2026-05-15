import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { topic } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate exactly 7 quiz questions about: ${topic}.
Return ONLY a valid JSON array. No markdown, no explanation.
Each item: {"q":"question","opts":["A","B","C","D"],"correct":0|1|2|3,"explain":"2 sentences plain English"}
Rules: plain everyday language, real-world scenarios, one clearly correct answer.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().replace(/```json|```/g, "").trim();
    const questions = JSON.parse(raw);

    return NextResponse.json({ questions });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}