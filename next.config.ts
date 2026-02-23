import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		formats: ["image/avif", "image/webp"],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "i.ytimg.com",
				port: "",
				pathname: "/vi/**",
			},
		],
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	webpack: (config) => {
		// Ajouter le loader pour les fichiers GLSL
		config.module.rules.push({
			test: /\.(glsl|vert|frag)$/,
			type: 'asset/source',
		});
		// Ajouter SVGR pour importer les SVG comme composants React
		config.module.rules.push({
			test: /\.svg$/,
			issuer: /\.[jt]sx?$/,
			use: [
				{
					loader: '@svgr/webpack',
					options: {
						svgoConfig: {
							plugins: [
								{
									name: 'preset-default',
									params: {
										overrides: {
											// Ne pas supprimer les styles CSS internes
											removeStyleElement: false,
											// Ne pas supprimer les attributs fill
											removeUselessStrokeAndFill: false,
											// Ne pas convertir les styles en attributs
											inlineStyles: false,
										},
									},
								},
							],
						},
					},
				},
			],
		});
		return config;
	},
};

export default nextConfig;
