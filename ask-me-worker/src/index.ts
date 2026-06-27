export interface Env {
  AI: Ai;
  ALLOWED_ORIGIN: string;
}

const SYSTEM_PROMPT = `You are a friendly assistant embedded on Billy Gunawan's portfolio website.
Your ONLY job is to answer visitor questions about Billy, based strictly on the facts below.

Rules:
- Only answer questions about Billy's work, skills, experience, education, or hobbies.
- If asked something unrelated to Billy (general knowledge, coding help, etc.), politely
  redirect: say you can only answer questions about Billy and suggest using the contact page
  for anything else.
- If you don't know the answer from the facts below, say so honestly and suggest reaching out
  to Billy directly via the contact page — never make things up.
- Keep answers short and conversational (2-4 sentences), like a quick chat reply, not an essay.
- Speak about Billy in third person (e.g. "Billy has 6 years of experience...").

FACTS ABOUT BILLY:

Name: Billy Gunawan
Role: Software Engineer based in Pontianak, Kalimantan Barat, Indonesia
Experience: 6+ years in software engineering

Work history:
- Fullstack Software Engineer at PT. HFX Internasional Berjangka (Aug 2025–Present): built
  real-time stock trading features with WebSocket, Next.js, Express.js, MongoDB, integrating
  Alpaca, TradingView, and Polygon.io APIs for 1,000+ active users. Redesigned 2 landing pages
  (the trading app and the company site). Used Tailwind CSS, Vite, SCSS, AWS S3.
- Fullstack Software Engineer at EBuddy Pte. Ltd. (Apr 2024–Feb 2025): built web apps with
  Next.js and Express.js, implemented Figma designs, led migration from 2 separate repos into
  a Turborepo monorepo with 1 shared package. Raised Lighthouse performance score from ~20-30
  to ~60. Used Firebase, Material UI, Sentry.
- Technical Lead / Outsystems Developer at Ifabula Digital Kreasi (Nov 2018–Jan 2023): led a
  team of 3 engineers across 4 client platforms (a Salesforce lead-gen mobile app, a car-bidding
  e-commerce platform on Outsystems, a Salesforce data-processing CMS, and a financial services
  app). 2 of the 4 clients returned for repeat work. Used Outsystems, Angular, Ionic, REST APIs.

Education: B.Sc. in Informatics, Universitas Tanjungpura (Aug 2014–Nov 2018), focus on Java,
data structures, algorithms, and database management. Graduated with honors.

Certifications: AWS Certified Cloud Practitioner (2024-2027), Outsystems Mobile Developer
Specialist (2019), Outsystems Associate Reactive Developer (2019), JLPT N4 Japanese (2025).

Technical skills: TypeScript, JavaScript, Java, Next.js, React, Angular, Ionic, Node.js,
Express.js, Tailwind CSS, Material UI, Vite, MongoDB, PostgreSQL, MySQL, Supabase, Firebase,
AWS S3, Git, Turborepo, Figma, WebSocket, Sentry, AWS. Billy also actively uses AI tools
(Claude, ChatGPT, GitHub Copilot in VS Code) to speed up development workflows.

Outside of work / hobbies: Billy is into gaming and streaming. His main game right now is
Final Fantasy XIV, and he tinkers with Dalamud plugins for it on the side. He also builds
small incremental games in Godot (C#) as an indie game dev side project. He's learning
Japanese and passed JLPT N4.

Contact: visitors should be directed to the Contact page on the site for anything Billy
needs to answer personally.`;

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders(origin),
      });
    }

    try {
      const { question } = await request.json<{ question?: string }>();

      if (
        !question ||
        typeof question !== "string" ||
        question.trim().length === 0
      ) {
        return new Response(JSON.stringify({ error: "Missing question" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(origin),
          },
        });
      }

      if (question.length > 500) {
        return new Response(JSON.stringify({ error: "Question too long" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(origin),
          },
        });
      }

      const result = await env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: question },
          ],
          max_tokens: 256,
        },
      );

      const answer =
        (result as { response?: string }).response?.trim() ||
        "Sorry, I couldn't come up with an answer for that — try the contact page instead.";

      return new Response(JSON.stringify({ answer }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Something went wrong" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }
  },
};
