import { factories } from '@strapi/strapi';

export default factories.createCoreController(
    'api::lesson-progress.lesson-progress',
    ({ strapi }: { strapi: any }) => ({
        async create(ctx: any) {

            const user = ctx.state.user;
            const { data } = ctx.request.body || {};

            // Priority: use explicitly sent student ID/documentId, otherwise fall back to authenticated user
            const studentId = data?.student || user?.documentId || user?.id;

            if (!studentId) {
                return ctx.badRequest('Student ID is required or user must be authenticated.');
            }

            try {
                // Direct Document Service call bypasses REST schema validator
                const newProgress = await strapi.documents('api::lesson-progress.lesson-progress').create({
                    data: {
                        isCompleted: data?.isCompleted ?? true,
                        lesson: data?.lesson,
                        student: studentId,
                    },
                });

                return { data: newProgress };
            } catch (err: any) {
                console.error('Error creating lesson progress:', err);
                return ctx.badRequest(err.message || 'Failed to create lesson progress');
            }
        },

        async update(ctx: any) {
            const { id } = ctx.params;
            const { data } = ctx.request.body || {};
            const user = ctx.state.user;

            const studentId = data?.student || user?.documentId || user?.id;

            try {
                const updatedProgress = await strapi.documents('api::lesson-progress.lesson-progress').update({
                    documentId: id,
                    data: {
                        isCompleted: data?.isCompleted ?? true,
                        ...(studentId ? { student: studentId } : {}),
                        ...(data?.lesson ? { lesson: data.lesson } : {}),
                    },
                });

                return { data: updatedProgress };
            } catch (err: any) {
                console.error('Error updating lesson progress:', err);
                return ctx.badRequest(err.message || 'Failed to update lesson progress');
            }
        },
    })
);