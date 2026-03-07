# ---- kotlinx.serialization ----
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** { *** Companion; }
-keepclasseswithmembers class kotlinx.serialization.json.** { kotlinx.serialization.KSerializer serializer(...); }
-keep,includedescriptorclasses class com.wiom.csp.**$$serializer { *; }
-keepclassmembers class com.wiom.csp.** { *** Companion; }
-keepclasseswithmembers class com.wiom.csp.** { kotlinx.serialization.KSerializer serializer(...); }

# ---- Retrofit ----
-keepattributes Signature
-keepattributes Exceptions
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * { @retrofit2.http.* <methods>; }
-dontwarn retrofit2.**

# ---- OkHttp ----
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# ---- Hilt / Dagger ----
-dontwarn dagger.**
-keep class dagger.** { *; }
-keep class javax.inject.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ViewComponentManager$FragmentContextWrapper { *; }

# ---- Room ----
-keep class * extends androidx.room.RoomDatabase { *; }
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao interface * { *; }

# ---- Compose ----
-dontwarn androidx.compose.**
-keep class androidx.compose.** { *; }

# ---- Sentry ----
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# ---- Coil ----
-keep class coil.** { *; }
-dontwarn coil.**

# ---- Domain models (keep for serialization) ----
-keep class com.wiom.csp.domain.model.** { *; }
-keep class com.wiom.csp.data.remote.dto.** { *; }
-keep class com.wiom.csp.data.db.** { *; }
