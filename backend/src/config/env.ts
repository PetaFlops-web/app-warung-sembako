import 'dotenv/config';

type Config = {
  server: {
    host: string;
    port: number;
  };
  jwt: {
    accessTokenKey: string;
    refreshTokenKey: string;
    accessTokenAge: number;
  };
};

const config: Config = {
  server: {
    host: process.env.HOST as string,
    port: Number(process.env.PORT),
  },
  jwt: {
    accessTokenKey: process.env.ACCESS_TOKEN_KEY as string,
    refreshTokenKey: process.env.REFRESH_TOKEN_KEY as string,
    accessTokenAge: Number(process.env.ACCESS_TOKEN_AGE),
  },
}

export default config;