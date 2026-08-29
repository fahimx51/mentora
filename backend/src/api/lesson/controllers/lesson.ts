import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson.lesson', ({ strapi }) => ({
    async findOne(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized('You must be logged in.');
        }

        // Fetch user with role
        const fullUser = await strapi.documents('plugin::users-permissions.user').findOne({
            documentId: String(user.documentId || user.id),
            populate: ['role'],
        });

        const userRole = fullUser?.role?.name?.toLowerCase();

        // 1. Admin and Content Manager see everything
        if (userRole === 'admin' || userRole === 'content manager') {
            return await super.findOne(ctx);
        }

        const { id } = ctx.params;

        // Fetch lesson with course + instructor relation
        const lesson = await strapi.documents('api::lesson.lesson').findOne({
            documentId: String(id),
            populate: { course: { populate: ['instructor'] } },
        });

        if (!lesson) {
            return ctx.notFound('Lesson not found.');
        }

        if (!lesson.course) {
            return ctx.badRequest('Lesson has no course assigned.');
        }

        const courseDocId = String(lesson.course.documentId || lesson.course.id);

        // 2. Instructor: allow only if they own this lesson's course
        if (userRole === 'instructor') {
            const isOwner = lesson.course.instructor?.id === user.id;
            if (isOwner) {
                return await super.findOne(ctx);
            }
            return ctx.forbidden('You can only access lessons from your own courses.');
        }

        // 3. Student: verify enrollment
        const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
            filters: {
                student: { id: user.id },
                course: { documentId: { $eq: courseDocId } },
            },
        });

        if (!enrollments || enrollments.length === 0) {
            return ctx.forbidden('You are not enrolled in this course.');
        }

        return await super.findOne(ctx);
    },
}));