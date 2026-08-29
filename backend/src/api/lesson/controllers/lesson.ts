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
        if (userRole === 'admin' || userRole === 'content manager') {
            return await super.findOne(ctx);
        }

        const { id } = ctx.params;

        // Fetch lesson with course relation
        const lesson = await strapi.documents('api::lesson.lesson').findOne({
            documentId: String(id),
            populate: ['course'],
        });

        if (!lesson) {
            return ctx.notFound('Lesson not found.');
        }

        if (!lesson.course) {
            return ctx.badRequest('Lesson has no course assigned.');
        }

        // Ensure string type for documentId filter
        const courseDocId = String(lesson.course.documentId || lesson.course.id);

        // Verify enrollment
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