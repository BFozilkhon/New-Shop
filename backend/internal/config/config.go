package config

import "os"

type Config struct {
	Env         string
	Port        string
	MongoURI    string
	DBName      string
	JWTSecret   string
	FrontendURL string
}

func Load() *Config {
	return &Config{
		Env:         getenv("ENV", "development"),
		Port:        getenv("PORT", "8081"),
		MongoURI:    getenv("MONGO_URI", "mongodb://localhost:27018"),
		DBName:      getenv("DB_NAME", "shop"),
		JWTSecret:   getenv("JWT_SECRET", "devsecret"),
		FrontendURL: getenv("FRONTEND_URL", "http://localhost:5174"),
	}
}

func getenv(k, d string) string { if v := os.Getenv(k); v != "" { return v }; return d } 