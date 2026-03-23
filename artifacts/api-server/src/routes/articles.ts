import { Router, type IRouter, type Request, type Response } from "express";
import { eq, count, and } from "drizzle-orm";
import { db, articlesTable, insertArticleSchema, updateArticleSchema } from "@workspace/db";

const router: IRouter = Router();

router.get("/articles", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const filters = [];
    if (req.query.published !== undefined) {
      const pub = req.query.published === "true";
      filters.push(eq(articlesTable.published, pub));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [articles, [{ value: total }]] = await Promise.all([
      db
        .select()
        .from(articlesTable)
        .where(where)
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(articlesTable)
        .where(where),
    ]);

    res.json({ data: articles, total: Number(total), page, limit });
  } catch (err) {
    req.log.error({ err }, "Failed to list articles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/articles", async (req: Request, res: Response) => {
  try {
    const body = insertArticleSchema.parse(req.body);

    const [article] = await db
      .insert(articlesTable)
      .values(body)
      .returning();

    res.status(201).json({ data: article });
  } catch (err) {
    if ((err as Error)?.name === "ZodError") {
      const zodErr = err as { flatten: () => unknown };
      res.status(400).json({ error: "Validation error", details: zodErr.flatten() });
      return;
    }
    const e = err as NodeJS.ErrnoException & { code?: string };
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409).json({ error: "Slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to create article");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/articles/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid article ID" });
      return;
    }

    const [article] = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.id, id));

    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    res.json({ data: article });
  } catch (err) {
    req.log.error({ err }, "Failed to get article");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/articles/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid article ID" });
      return;
    }

    const body = updateArticleSchema.parse(req.body);

    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: "No fields provided to update" });
      return;
    }

    const [article] = await db
      .update(articlesTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(articlesTable.id, id))
      .returning();

    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    res.json({ data: article });
  } catch (err) {
    if ((err as Error)?.name === "ZodError") {
      const zodErr = err as { flatten: () => unknown };
      res.status(400).json({ error: "Validation error", details: zodErr.flatten() });
      return;
    }
    const e = err as NodeJS.ErrnoException & { code?: string };
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409).json({ error: "Slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to update article");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/articles/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid article ID" });
      return;
    }

    const [deleted] = await db
      .delete(articlesTable)
      .where(eq(articlesTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete article");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
