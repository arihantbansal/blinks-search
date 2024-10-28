/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		outputFileTracingIncludes: {
			'/api/writeActionsToFile': ['./blinks.json'],
		}
	}
};

export default nextConfig;
