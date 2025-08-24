import { CourseService } from "./service";
import { type Request, type Response } from "express";

export class CourseController {
  private service: CourseService;

  constructor(service: CourseService) {
    this.service = service;
  }

  async getCourses(req: Request, res: Response) {
    try {
      const courses = await this.service.getCourse();
      res.send(courses);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
