export const APP_VERSION = '1.0.0';
export const RELEASE_DATE = '2026-08-30';
export const BUILD_IDENTIFIER = 'SSIU-ERP-v1.0.0-PROD-20260830';
export const ENVIRONMENT = 'production';

export interface ReleaseInfo {
  version: string;
  releaseDate: string;
  buildIdentifier: string;
  environment: string;
}

export const getReleaseInfo = (): ReleaseInfo => ({
  version: APP_VERSION,
  releaseDate: RELEASE_DATE,
  buildIdentifier: BUILD_IDENTIFIER,
  environment: ENVIRONMENT,
});
