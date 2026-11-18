import 'dotenv/config';

const TOKEN_AGE_PATTERN = /^\d+(s|m|h|d|w)$/;

type TokenAge = `${number}${'s' | 'm' | 'h' | 'd' | 'w'}`;

function requireTokenAge(value: string | undefined, name: string): TokenAge {
  if (!value || !TOKEN_AGE_PATTERN.test(value)) {
    throw new Error(`${name} wajib diisi dengan format <angka><s|m|h|d|w>, contoh: 7d`);
  }

  return value as TokenAge;
}

type Config = {
  server: {
    host: string;
    port: number;
  };
  jwt: {
    accessTokenKey: string;
    refreshTokenKey: string;
    accessTokenAge: number;
    refreshTokenAge: TokenAge;
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
    refreshTokenAge: requireTokenAge(process.env.REFRESH_TOKEN_AGE, 'REFRESH_TOKEN_AGE'),
  },
}

export default config;
