import type { IPostNavagationRepository } from "../../controllers/create-navagation-logs/protocols";
import { prisma } from "../../core/database/prisma";
import { NavigationLogs } from "../../models/nagation-logs";



export class PostgresPostNavigationLogs implements IPostNavagationRepository {
    async postNavigationLogs(NavigationLogsData: NavigationLogs) {
        console.log("Posting NavigationLogs to PostgreSQL database...");
        // postar usuário
        const newNavagationLog = await prisma.navigationNode.create({
            data: {
                parentId: NavigationLogsData.parentId,
                title: NavigationLogsData.title,
                slug: NavigationLogsData.slug,
                prompt: NavigationLogsData.prompt,
                answerSummary: NavigationLogsData.answerSummary,
                evidenceExcerpt: NavigationLogsData.evidenceExcerpt,
                evidenceSource: NavigationLogsData.evidenceSource,
                displayOrder: NavigationLogsData.displayOrder,
                isActive: NavigationLogsData.isActive
            }
        });
        return newNavagationLog;
    }
}