plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.hilt.android)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.wiom.csp"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.wiom.csp"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Defaults (overridden per flavor)
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3457\"")
        buildConfigField("String", "BACKEND_BASE_URL", "\"http://10.0.2.2:4000\"")
        buildConfigField("boolean", "USE_MOCK", "false")
        buildConfigField("String", "SENTRY_DSN", "\"\"")
    }

    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("WIOM_KEYSTORE_PATH")
            if (keystorePath != null) {
                storeFile = file(keystorePath)
                storePassword = System.getenv("WIOM_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("WIOM_KEY_ALIAS")
                keyPassword = System.getenv("WIOM_KEY_PASSWORD")
            } else {
                // Fallback to debug keystore for local builds
                storeFile = file(System.getProperty("user.home") + "/.android/debug.keystore")
                storePassword = "android"
                keyAlias = "androiddebugkey"
                keyPassword = "android"
            }
        }
    }

    flavorDimensions += "environment"
    productFlavors {
        create("dev") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3457\"")
            buildConfigField("String", "BACKEND_BASE_URL", "\"http://10.0.2.2:4000\"")
            buildConfigField("boolean", "USE_MOCK", "true")
            buildConfigField("String", "SENTRY_DSN", "\"\"")
        }
        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            buildConfigField("String", "API_BASE_URL", "\"https://api.staging.wiom.in/csp/v1/\"")
            buildConfigField("String", "BACKEND_BASE_URL", "\"https://api.staging.wiom.in/\"")
            buildConfigField("boolean", "USE_MOCK", "false")
            buildConfigField("String", "SENTRY_DSN", "\"\"")
        }
        create("prod") {
            dimension = "environment"
            buildConfigField("String", "API_BASE_URL", "\"https://api.wiom.in/csp/v1/\"")
            buildConfigField("String", "BACKEND_BASE_URL", "\"https://api.wiom.in/\"")
            buildConfigField("boolean", "USE_MOCK", "false")
            buildConfigField("String", "SENTRY_DSN", "\"\"")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // AndroidX Core
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    // Compose
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)
    debugImplementation(libs.androidx.ui.tooling)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.android.compiler)
    implementation(libs.hilt.navigation.compose)

    // Networking
    implementation(libs.retrofit)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.retrofit.kotlinx.serialization)

    // DataStore
    implementation(libs.androidx.datastore.preferences)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Splash Screen
    implementation("androidx.core:core-splashscreen:1.0.1")

    // Image Loading
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Sentry Crash Reporting
    implementation("io.sentry:sentry-android:7.19.0")

    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
}
