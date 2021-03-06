import { hashPassword } from "../../common/authentication";
import { secureId } from "../../common/secureId";
import { Context } from "../../common/types";
import { Avatar } from "../../database/entity/Avatar";
import { User } from "../../database/entity/User";
import { Resolvers } from "../resolvers-types.generated";

const resolvers: Resolvers<Context> = {
  Query: {
    users: (rootValue, args, { connection }) => connection.manager.find(User),

    user: (rootValue, { id }, { connection }) =>
      connection.manager.findOneOrFail(User, id)
  },

  Mutation: {
    createUser: async (rootValue, args, { connection }) => {
      const { avatar: avatarAttributes, ...userAttributes } = args.input;

      const queryRunner = connection.createQueryRunner();
      await queryRunner.connect();

      try {
        await queryRunner.startTransaction();

        const avatar = queryRunner.manager.create(Avatar, avatarAttributes);
        await queryRunner.manager.save(avatar);

        // TODO: Add validations for userAttributes, like email, password min length etc
        const user = queryRunner.manager.create(User, {
          ...userAttributes,
          passwordHash: hashPassword(userAttributes.password),
          avatar
        });
        await queryRunner.manager.save(user);

        return user;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    },

    updateUser: async (rootValue, args, { connection }) => {
      const { id, ...userAttributes } = args.input;

      const user = await connection.manager.findOneOrFail(User, id);
      return connection.manager.save(
        connection.manager.merge(User, user, userAttributes)
      );
    },

    deleteUser: async (rootValue, { id }, { connection }) => {
      await connection.manager.delete(User, { id });

      return secureId.toExternal(id, "User");
    }
  },

  Avatar: {
    image: ({ imagePath: path }, args, { assetsBaseUrl }) => ({
      path,
      url: assetsBaseUrl + path
    })
  }
};

export default resolvers;
