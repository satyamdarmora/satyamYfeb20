package com.wiom.csp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.wiom.csp.ui.navigation.WiomNavGraph
import com.wiom.csp.ui.theme.WiomCspTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            WiomCspTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = WiomCspTheme.colors.bgPrimary
                ) {
                    WiomNavGraph()
                }
            }
        }
    }
}
