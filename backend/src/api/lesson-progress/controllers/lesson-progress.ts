import { factories } from '@strapi/strapi';

export default factories.createCoreController(
    'api::lesson-progress.lesson-progress',
    ({ strapi }: { strapi: any }) => ({
        // GET /api/lesson-progresses
        async find(ctx: any) {
            const user = ctx.state.user;

            if (!user) {
                return ctx.unauthorized('You must be logged in to view lesson progress.');
            }

            const roleType = user.role?.type;
            const isAdminOrManager = roleType === 'admin' || roleType === 'content_manager';

            const baseFilters = (ctx.query.filters as Record<string, any>) || {};

            // Filter progress entries to only return data for the logged-in student
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
                const results = await strapi.documents('api::lesson-progress.lesson-progress').findMany({
                    filters,
                    populate: ctx.query.populate || true,
                });

                return { data: results };
            } catch (err: any) {
                console.error('Error fetching lesson progress:', err);
                return ctx.badRequest('Failed to fetch lesson progress records');
            }
        },

        // POST /api/lesson-progresses
        async create(ctx: any) {
            const user = ctx.state.user;
            const bodyData = ctx.request.body?.data || ctx.request.body || {};

            const studentId = bodyData?.student || user?.documentId || user?.id;
            const lessonId = bodyData?.lesson;

            if (!studentId) {
                return ctx.badRequest('Student ID is required or user must be authenticated.');
            }

            try {
                const newProgress = await strapi.documents('api::lesson-progress.lesson-progress').create({
                    data: {
                        isCompleted: bodyData?.isCompleted ?? true,
                        lesson: lessonId,
                        student: studentId,
                    },
                    status: 'published',
                });

                return { data: newProgress };
            } catch (err: any) {
                console.error('Error creating lesson progress:', err);
                return ctx.badRequest(err.message || 'Failed to create lesson progress');
            }
        },

        // PUT /api/lesson-progresses/:id
        async update(ctx: any) {
            const { id } = ctx.params;
            const user = ctx.state.user;
            const bodyData = ctx.request.body?.data || ctx.request.body || {};

            const studentId = bodyData?.student || user?.documentId || user?.id;

            try {
                const updatedProgress = await strapi.documents('api::lesson-progress.lesson-progress').update({
                    documentId: id,
                    data: {
                        isCompleted: bodyData?.isCompleted ?? true,
                        ...(studentId ? { student: studentId } : {}),
                        ...(bodyData?.lesson ? { lesson: bodyData.lesson } : {}),
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