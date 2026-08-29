import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
    async find(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.send({ data: [] });
        }

        const queryFilters = (ctx.query?.filters as Record<string, any>) || {};
        const courseDocId = queryFilters?.course?.documentId?.$eq || queryFilters?.course;

        // Fetch user with role if role is not automatically populated in ctx.state.user
        const currentUser = await strapi.documents('plugin::users-permissions.user').findOne({
            documentId: user.documentId || user.id,
            populate: ['role'],
        });

        const roleName = currentUser?.role?.name || currentUser?.role?.type || '';
        
        const isAdminOrInstructor = ['admin', 'instructor', 'content manager'].includes(roleName.toLowerCase());

        const filters: Record<string, any> = {};

        // Keep current student restriction logic ONLY for normal students
        if (!isAdminOrInstructor) {
            filters.student = { id: { $eq: user.id } };
        }

        if (courseDocId) {
            filters.course = { documentId: { $eq: String(courseDocId) } };
        }

        // Fetch enrollments with populated relations
        const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
            filters,
            populate: ['student', 'course'],
            status: 'published',
        });

        return ctx.send({ data: enrollments });
    },

    async create(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.badRequest('You must be logged in to enroll.');
        }

        const { course } = ctx.request.body?.data || {};

        if (!course) {
            return ctx.badRequest('Course identifier is required.');
        }

        // Fetch user documentId to satisfy Strapi 5 relation requirements
        const userDoc = await strapi.documents('plugin::users-permissions.user').findOne({
            documentId: user.documentId,
        });

        const studentTarget = userDoc?.documentId || user.id;

        // Create enrollment with published status
        const newEnrollment = await strapi.documents('api::enrollment.enrollment').create({
            data: {
                course: course,
                student: studentTarget,
            },
            status: 'published',
        });

        // Publish document explicitly
        const publishedEnrollment = await strapi.documents('api::enrollment.enrollment').publish({
            documentId: newEnrollment.documentId,
        });

        return ctx.send({ data: publishedEnrollment || newEnrollment });
    },
}));