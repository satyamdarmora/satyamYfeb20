package com.wiom.csp.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.wiom.csp.data.remote.BackendApiService
import com.wiom.csp.data.remote.dto.StatusData
import dagger.hilt.android.qualifiers.ApplicationContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.max
import kotlin.math.sqrt

@Singleton
class PendingRepository @Inject constructor(
    private val backendApi: BackendApiService,
    @ApplicationContext private val context: Context
) {

    suspend fun getStatus(token: String): Result<StatusData> = runCatching {
        val response = backendApi.getPartnerStatus(authorization = "Bearer $token")
        if (response.status != 0) {
            error(response.msg ?: "Failed to fetch status")
        }
        response.data ?: error("No status data returned")
    }

    suspend fun respond(
        token: String,
        text: String?,
        files: List<Pair<String, Uri>> // docType to file URI
    ): Result<Unit> = runCatching {
        val responseBody = text?.takeIf { it.isNotBlank() }
            ?.toRequestBody("text/plain".toMediaType())

        val docTypesJson = "[" + files.joinToString(",") { "\"${it.first}\"" } + "]"
        val docTypesBody = docTypesJson.toRequestBody("text/plain".toMediaType())

        val parts = files.map { (docType, uri) ->
            val bytes = compressImage(uri)
            val mimeType = context.contentResolver.getType(uri) ?: "application/octet-stream"
            val fileName = getFileName(uri) ?: "$docType.jpg"
            val requestBody = bytes.toRequestBody(mimeType.toMediaType())
            MultipartBody.Part.createFormData("documents", fileName, requestBody)
        }

        val result = backendApi.respondToInfoRequest(
            authorization = "Bearer $token",
            response = responseBody,
            documentTypes = docTypesBody,
            documents = parts
        )
        if (result.status != 0) {
            error(result.msg ?: "Failed to submit response")
        }
    }

    private fun compressImage(uri: Uri): ByteArray {
        val inputStream = context.contentResolver.openInputStream(uri)
            ?: error("Cannot read file")
        val mimeType = context.contentResolver.getType(uri) ?: ""

        // If not an image, return raw bytes
        if (!mimeType.startsWith("image/")) {
            return inputStream.use { it.readBytes() }
        }

        val originalBytes = inputStream.use { it.readBytes() }
        val bitmap = BitmapFactory.decodeByteArray(originalBytes, 0, originalBytes.size)
            ?: return originalBytes

        // Scale down if needed (max 1600px on longest side)
        val maxDim = 1600
        val scaled = if (bitmap.width > maxDim || bitmap.height > maxDim) {
            val ratio = maxDim.toFloat() / max(bitmap.width, bitmap.height)
            val newW = (bitmap.width * ratio).toInt()
            val newH = (bitmap.height * ratio).toInt()
            Bitmap.createScaledBitmap(bitmap, newW, newH, true).also {
                if (it !== bitmap) bitmap.recycle()
            }
        } else {
            bitmap
        }

        val out = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, 70, out)
        scaled.recycle()
        return out.toByteArray()
    }

    private fun getFileName(uri: Uri): String? {
        val cursor = context.contentResolver.query(uri, null, null, null, null)
        return cursor?.use {
            val nameIndex = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
            if (it.moveToFirst() && nameIndex >= 0) it.getString(nameIndex) else null
        }
    }
}
