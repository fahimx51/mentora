import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
    async findOne(ctx) {
        const user = ctx.state.user;
        const response = await super.findOne(ctx);

        if (!response || !response.data) return response;

        const sanitizeCourse = async (courseData: any) => {
            const courseDocId = String(courseData.documentId || courseData.id);

            if (user) {
                const userDocId = String(user.documentId || user.id);

                const fullUser = await strapi.documents('plugin::users-permissions.user').findOne({
                    documentId: userDocId,
                    populate: ['role'],
                });

                const roleName = fullUser?.role?.name?.toLowerCase();

                // 1. Admin and Content Manager see everything, always
                if (roleName === 'admin' || roleName === 'content manager') {
                    return courseData;
                }

                // 2. Instructor sees everything ONLY for their own course
                if (roleName === 'instructor') {
                    const courseWithInstructor = await strapi.documents('api::course.course').findOne({
                        documentId: courseDocId,
                        populate: ['instructor'],
                    });

                    // Match via documentId or fallback id
                    const isOwner =
                        courseWithInstructor?.instructor?.documentId === user.documentId ||
                        courseWithInstructor?.instructor?.id === user.id;

                    if (isOwner) {
                        return courseData;
                    }
                }
            }

            // 3. Check Enrollment (Student, or non-owning Instructor)
            let isEnrolled = false;
            if (user) {
                const userDocId = String(user.documentId || user.id);

                // Strapi 5 FIX: Filter student using documentId instead of numeric id
                const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
                    filters: {
                        student: { documentId: { $eq: userDocId } },
                        course: { documentId: { $eq: courseDocId } },
                    },
                });

                if (enrollments && enrollments.length > 0) {
                    isEnrolled = true;
                }
            }

            // 4. Strip sensitive lesson fields if unenrolled
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

        if (Array.isArray(response.data)) {
            let fullUser: any = null;
            let roleName = '';
            const userDocId = user ? String(user.documentId || user.id) : null;

            if (user && userDocId) {
                fullUser = await strapi.documents('plugin::users-permissions.user').findOne({
                    documentId: userDocId,
                    populate: ['role'],
                });
                roleName = fullUser?.role?.name?.toLowerCase() || '';
            }

            for (let i = 0; i < response.data.length; i++) {
                const courseData = response.data[i];
                const courseDocId = String(courseData.documentId || courseData.id);

                // 1. Admin and Content Manager see everything
                if (roleName === 'admin' || roleName === 'content manager') {
                    continue;
                }

                // 2. Instructor sees everything for their own courses
                if (roleName === 'instructor') {
                    const courseWithInstructor = await strapi.documents('api::course.course').findOne({
                        documentId: courseDocId,
                        populate: ['instructor'],
                    });
                    const isOwner =
                        courseWithInstructor?.instructor?.documentId === user?.documentId ||
                        courseWithInstructor?.instructor?.id === user?.id;

                    if (isOwner) {
                        continue;
                    }
                }

                // 3. Check Enrollment (Student, or non-owning Instructor)
                let isEnrolled = false;
                if (user && userDocId) {
                    // Strapi 5 FIX: Filter student using documentId
                    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
                        filters: {
                            student: { documentId: { $eq: userDocId } },
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