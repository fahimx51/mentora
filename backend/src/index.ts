import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    const usersPermissionsPlugin = strapi.plugin('users-permissions');

    if (usersPermissionsPlugin) {
      // OVERRIDE ME CONTROLLER (/api/users/me) ONLY
      usersPermissionsPlugin.controllers.user.me = async (ctx: any) => {
        const user = ctx.state.user;

        if (!user) {
          return ctx.unauthorized('You must be logged in');
        }

        // Fetch user profile with populated role using Strapi v5 Document API
        const userWithRole = await strapi
          .documents('plugin::users-permissions.user')
          .findOne({
            documentId: user.documentId,
            populate: ['role'],
          });

        if (!userWithRole) {
          return ctx.notFound('User not found');
        }

        // Return user data including role object
        ctx.body = {
          id: userWithRole.id,
          documentId: userWithRole.documentId,
          username: userWithRole.username,
          email: userWithRole.email,
          confirmed: userWithRole.confirmed,
          blocked: userWithRole.blocked,
          createdAt: userWithRole.createdAt,
          updatedAt: userWithRole.updatedAt,
          role: userWithRole.role
            ? {
                id: userWithRole.role.id,
                documentId: userWithRole.role.documentId,
                name: userWithRole.role.name,
                type: userWithRole.role.type,
                description: userWithRole.role.description,
              }
            : null,
        };
      };
    }
  },

  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};