import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz-result.quiz-result', ({ strapi }) => ({
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

            // Build safe filters for student
            const studentFilter = typeof studentId === 'string'
                ? { documentId: { $eq: studentId } }
                : { id: { $eq: studentId } };

            // Build safe filters for quiz
            const quizFilter = typeof quiz === 'string'
                ? { documentId: { $eq: quiz } }
                : { id: { $eq: Number(quiz) || quiz } };

            // 1. Check if user already submitted this quiz
            const existingResults = await strapi.documents('api::quiz-result.quiz-result').findMany({
                filters: {
                    quiz: quizFilter,
                    student: studentFilter,
                },
            });

            if (existingResults && existingResults.length > 0) {
                return ctx.badRequest('You have already completed this quiz.');
            }

            // 2. Create the entry safely using Document API
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