import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
    async findOne(ctx) {
        const user = ctx.state.user;
        const response = await super.findOne(ctx);

        if (!response || !response.data) return response;

        // Helper function to sanitize a single course object
        const sanitizeCourse = async (courseData: any) => {
            // 1. Allow Admins and Content Managers
            if (user) {
                const fullUser = await strapi.documents('plugin::users-permissions.user').findOne({
                    documentId: String(user.documentId || user.id),
                    populate: ['role'],
                });

                const roleName = fullUser?.role?.name?.toLowerCase();
                if (roleName === 'admin' || roleName === 'content manager') {
                    return courseData;
                }
            }

            const courseDocId = String(courseData.documentId || courseData.id);

            // 2. Check Enrollment
            let isEnrolled = false;
            if (user) {
                const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
                    filters: {
                        student: { id: user.id },
                        course: { documentId: { $eq: courseDocId } },
                    },
                });

                if (enrollments && enrollments.length > 0) {
                    isEnrolled = true;
                }
            }

            // 3. Strip sensitive lesson fields if unenrolled
            if (!isEnrolled) {
                // Handle Strapi v5 (flat format)
                if (Array.isArray(courseData.lessons)) {
                    courseData.lessons = courseData.lessons.map((lesson: any) => ({
                        ...lesson,
                        videoUrl: null,
                        content: null,
                    }));
                }
                // Handle Strapi v4 (nested attributes format)
                else if (courseData.attributes?.lessons?.data) {
                    courseData.attributes.lessons.data = courseData.attributes.lessons.data.map((lesson: any) => ({
                        ...lesson,
                        attributes: {
                            ...lesson.attributes,
                            videoUrl: null,
                            content: null,
                        },
                    }));
                }
            }

            return courseData;
        };

        if (Array.isArray(response.data)) {
            response.data = await Promise.all(response.data.map(sanitizeCourse));
        } else {
            response.data = await sanitizeCourse(response.data);
        }

        return response;
    },

    async find(ctx) {
        const user = ctx.state.user;
        const response = await super.find(ctx);

        if (!response || !response.data) return response;

        // Sanitize each course in array
        if (Array.isArray(response.data)) {
            for (let i = 0; i < response.data.length; i++) {
                const courseData = response.data[i];
                const courseDocId = String(courseData.documentId || courseData.id);

                let isEnrolled = false;
                if (user) {
                    // Check role first
                    const fullUser = await strapi.documents('plugin::users-permissions.user').findOne({
                        documentId: String(user.documentId || user.id),
                        populate: ['role'],
                    });
                    const roleName = fullUser?.role?.name?.toLowerCase();
                    if (roleName === 'admin' || roleName === 'content manager') {
                        continue; // Skip stripping for admins
                    }

                    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
                        filters: {
                            student: { id: user.id },
                            course: { documentId: { $eq: courseDocId } },
                        },
                    });
                    if (enrollments && enrollments.length > 0) {
                        isEnrolled = true;
                    }
                }

                if (!isEnrolled) {
                    if (Array.isArray(courseData.lessons)) {
                        courseData.lessons = courseData.lessons.map((lesson: any) => ({
                            ...lesson,
                            videoUrl: null,
                            content: null,
                        }));
                    } else if (courseData.attributes?.lessons?.data) {
                        courseData.attributes.lessons.data = courseData.attributes.lessons.data.map((lesson: any) => ({
                            ...lesson,
                            attributes: {
                                ...lesson.attributes,
                                videoUrl: null,
                                content: null,
                            },
                        }));
                    }
                }
            }
        }

        return response;
    },
}));