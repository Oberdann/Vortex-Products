import { Params } from 'nestjs-pino';

export const loggerConfig: Params = {
  pinoHttp: {
    level: 'info',
    autoLogging: true,

    base: {
      service: 'products-service',
    },

    serializers: {
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },

    customLogLevel: (req, res, err) => {
      if (req.url?.includes('/metrics')) return 'silent';

      if (res.statusCode >= 500 || err) return 'error';

      if (res.statusCode >= 400) return 'warn';

      return 'info';
    },

    customProps: () => {
      return {};
    },
  },
};
