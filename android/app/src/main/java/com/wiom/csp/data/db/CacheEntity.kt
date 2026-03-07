package com.wiom.csp.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Simple key-value JSON cache for non-relational data (assurance, wallet, etc.)
 */
@Entity(tableName = "cache")
data class CacheEntity(
    @PrimaryKey val key: String,
    val json: String,
    val updatedAt: Long = System.currentTimeMillis()
)
