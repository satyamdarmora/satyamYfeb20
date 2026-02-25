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

        // Default API base URL (overridden per flavor)
        buildConfigField("String", "API_BASE_URL", "\"http://satyam.wiom.in/csp\"")
        buildConfigField("String", "BACKEND_BASE_URL", "\"http://satyam.wiom.in\"")
    }

    flavorDimensions += "target"
    productFlavors {
        create("device") {
            dimension = "target"
            buildConfigField("String", "API_BASE_URL", "\"http://192.168.0.173:3457\"")
            buildConfigField("String", "BACKEND_BASE_URL", "\"http://192.168.0.173:4000\"")
        }
        create("emulator") {
            dimension = "target"
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3457\"")
            buildConfigField("String", "BACKEND_BASE_URL", "\"http://10.0.2.2:4000\"")
        }
        create("production") {
            dimension = "target"
            buildConfigField("String", "API_BASE_URL", "\"http://satyam.wiom.in/csp\"")
            buildConfigField("String", "BACKEND_BASE_URL", "\"http://satyam.wiom.in\"")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
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
}
