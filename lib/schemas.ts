import { z } from "zod";

export const ResumeEntry = z.object({
  org: z.string(),
  location: z.string().default(""),
  role: z.string().default(""),
  dates: z.string().default(""),
  bullets: z.array(z.string()).default([]),
});

export const Resume = z.object({
  name: z.string(),
  contact: z.array(z.string()).default([]),
  education: z.array(
    z.object({
      school: z.string(),
      location: z.string().default(""),
      degree: z.string().default(""),
      dates: z.string().default(""),
      details: z.array(z.string()).default([]),
    })
  ).default([]),
  sections: z.array(
    z.object({ title: z.string(), entries: z.array(ResumeEntry).default([]) })
  ).default([]),
  skills: z.array(z.string()).default([]),
});
export type ResumeT = z.infer<typeof Resume>;

export const JobHit = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string().default(""),
  url: z.string().default(""),
  deadline: z.string().default(""),
  status: z.enum(["open", "closing_soon", "closed", "unknown"]).default("unknown"),
  why: z.string().default(""),
});
export type JobHitT = z.infer<typeof JobHit>;
