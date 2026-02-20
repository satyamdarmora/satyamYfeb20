package com.wiom.csp.di

import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/**
 * Repository module -- all repositories use constructor injection with @Inject + @Singleton,
 * so Hilt can resolve them automatically. This module exists as an extension point
 * for binding interfaces to implementations if needed in the future.
 */
@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule
