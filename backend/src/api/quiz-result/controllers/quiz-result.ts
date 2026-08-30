import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz-result.quiz-result', ({ strapi }) => ({
    async find(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized('You must be logged in to view quiz results.');
        }

        const roleType = user.role?.type;
        const isAdminOrManager = roleType === 'admin' || roleType === 'content_manager';

        // Base filters from incoming request query
        const baseFilters = (ctx.query.filters as Record<string, any>) || {};

        // Force filter by student for regular users
        const filters = isAdminOrManager
            ? baseFilters
            : {
                ...baseFilters,
                student: {
                    id: {
                        $eq: user.id,
                    },
                },
            };

        try {
            // Use Strapi 5 Document API directly to avoid Query Engine validation issues
            const results = await strapi.documents('api::quiz-result.quiz-result').findMany({
                filters,
                populate: {
                    quiz: {
                        fields: ['id', 'documentId', 'title'],
                    },
                },
                sort: 'createdAt:desc',
            });

            return { data: results };
        } catch (err: unknown) {
            console.error('--- QUIZ RESULTS FIND ERROR ---', err);
            return ctx.badRequest('Failed to fetch quiz results');
        }
    },

    async create(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized('You must be logged in to submit a quiz');
        }

        const { score, totalQuestions, answer, quiz } = ctx.request.body.data || {};

        if (!quiz) {
            return ctx.badRequest('Quiz ID is required');
        }

        try {
            const studentId = user.documentId || user.id;

            const studentFilter = typeof studentId === 'string'
                ? { documentId: { $eq: studentId } }
                : { id: { $eq: studentId } };

            const quizFilter = typeof quiz === 'string'
                ? { documentId: { $eq: quiz } }
                : { id: { $eq: Number(quiz) || quiz } };

            const existingResults = await strapi.documents('api::quiz-result.quiz-result').findMany({
                filters: {
                    quiz: quizFilter,
                    student: studentFilter,
                },
            });

            if (existingResults && existingResults.length > 0) {
                return ctx.badRequest('You have already completed this quiz.');
            }

            const newResult = await strapi.documents('api::quiz-result.quiz-result').create({
                data: {
                    score,
                    totalQuestions,
                    answer,
                    quiz,
                    student: studentId,
                },
                status: 'published',
            });

            return { data: newResult };
        } catch (err: unknown) {
            console.error('--- STRAPI CONTROLLER ERROR ---', err);

            const errorMessage = err instanceof Error ? err.message : 'Failed to save quiz result';
            return ctx.badRequest(errorMessage);
        }
    },
}));