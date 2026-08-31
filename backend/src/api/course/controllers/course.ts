import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
    async findOne(ctx) {
        const user = ctx.state.user;
        const { id } = ctx.params; // Document ID or ID

        // Fetch course with full nested population for lessons, lesson_progresses, and student
        const courseData = await strapi.documents('api::course.course').findOne({
            documentId: id,
            populate: {
                instructor: true,
                quizzes: true,
                lessons: {
                    populate: {
                        lesson_progresses: {
                            populate: {
                                student: {
                                    fields: ['id', 'documentId'],
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!courseData) {
            return ctx.notFound('Course not found');
        }

        const sanitizeCourse = async (data: any) => {
            const courseDocId = String(data.documentId || data.id);

            // 1. Filter lesson_progresses to match ONLY current user
            if (user && Array.isArray(data.lessons)) {
                const userIdStr = String(user.id);
                const userDocIdStr = user.documentId ? String(user.documentId) : null;

                data.lessons = data.lessons.map((lesson: any) => {
                    const currentLessonDocId = String(lesson.documentId || lesson.id);

                    if (Array.isArray(lesson.lesson_progresses)) {
                        lesson.lesson_progresses = lesson.lesson_progresses.filter((lp: any) => {
                            // If student field isn't populated, keep it if lp exists (fallback)
                            if (!lp.student) return true;

                            const studentId = typeof lp.student === 'object' ? lp.student?.id : lp.student;
                            const studentDocId = typeof lp.student === 'object' ? lp.student?.documentId : lp.student;

                            const isSameStudent =
                                String(studentId) === userIdStr ||
                                (userDocIdStr && String(studentDocId) === userDocIdStr) ||
                                (userDocIdStr && String(studentId) === userDocIdStr);

                            const lpLessonId = typeof lp.lesson === 'object' ? (lp.lesson?.documentId || lp.lesson?.id) : lp.lesson;
                            const isSameLesson = !lpLessonId || String(lpLessonId) === currentLessonDocId;

                            return isSameStudent && isSameLesson;
                        });
                    } else {
                        lesson.lesson_progresses = [];
                    }
                    return lesson;
                });
            } else if (Array.isArray(data.lessons)) {
                // Clear progress if guest
                data.lessons = data.lessons.map((lesson: any) => ({
                    ...lesson,
                    lesson_progresses: [],
                }));
            }

            // 2. Check Role (Admin / Instructor)
            if (user) {
                const userDocId = String(user.documentId || user.id);
                const fullUser = await strapi.documents('plugin::users-permissions.user').findOne({
                    documentId: userDocId,
                    populate: ['role'],
                });

                const roleName = fullUser?.role?.name?.toLowerCase();
                if (roleName === 'admin' || roleName === 'content manager') {
                    return data;
                }

                if (roleName === 'instructor') {
                    const courseWithInstructor = await strapi.documents('api::course.course').findOne({
                        documentId: courseDocId,
                        populate: ['instructor'],
                    });

                    const isOwner =
                        courseWithInstructor?.instructor?.documentId === user.documentId ||
                        courseWithInstructor?.instructor?.id === user.id;

                    if (isOwner) return data;
                }
            }

            // 3. Check Enrollment Status
            let isEnrolled = false;
            if (user) {
                const userDocId = String(user.documentId || user.id);
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
                if (Array.isArray(data.lessons)) {
                    data.lessons = data.lessons.map((lesson: any) => ({
                        ...lesson,
                        videoUrl: null,
                        content: null,
                        lesson_progresses: [],
                    }));
                }
            }

            return data;
        };

        const sanitizedData = await sanitizeCourse(courseData);
        return { data: sanitizedData };
    },

    async find(ctx) {
        const user = ctx.state.user;
        const response = await super.find(ctx);

        if (!response || !response.data) return response;

        if (Array.isArray(response.data)) {
            for (let i = 0; i < response.data.length; i++) {
                const courseData = response.data[i];
                if (user && Array.isArray(courseData.lessons)) {
                    const userIdStr = String(user.id);
                    const userDocIdStr = user.documentId ? String(user.documentId) : null;

                    courseData.lessons = courseData.lessons.map((lesson: any) => {
                        const currentLessonDocId = String(lesson.documentId || lesson.id);

                        if (Array.isArray(lesson.lesson_progresses)) {
                            lesson.lesson_progresses = lesson.lesson_progresses.filter((lp: any) => {
                                if (!lp.student) return true;

                                const studentId = typeof lp.student === 'object' ? lp.student?.id : lp.student;
                                const studentDocId = typeof lp.student === 'object' ? lp.student?.documentId : lp.student;

                                const isSameStudent =
                                    String(studentId) === userIdStr ||
                                    (userDocIdStr && String(studentDocId) === userDocIdStr) ||
                                    (userDocIdStr && String(studentId) === userDocIdStr);

                                const lpLessonId = typeof lp.lesson === 'object' ? (lp.lesson?.documentId || lp.lesson?.id) : lp.lesson;
                                const isSameLesson = !lpLessonId || String(lpLessonId) === currentLessonDocId;

                                return isSameStudent && isSameLesson;
                            });
                        } else {
                            lesson.lesson_progresses = [];
                        }
                        return lesson;
                    });
                }
            }
        }

        return response;
    },
}));