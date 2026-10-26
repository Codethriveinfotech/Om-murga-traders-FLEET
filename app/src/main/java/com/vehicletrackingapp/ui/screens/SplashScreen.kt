package com.vehicletrackingapp.ui.screens

import android.util.Log
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vehicletrackingapp.R
import com.vehicletrackingapp.ui.screens.common.shineEffect
import com.vehicletrackingapp.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch


@Composable
fun SplashScreen(onFinished: (nextRoute: String) -> Unit) {
    val scale = remember { Animatable(1f) }
    
    
    // Standard Pulse effect using a Shape instead of Canvas
    val pulseTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by pulseTransition.animateFloat(
        initialValue = 0.8f, targetValue = 1.2f,
        animationSpec = infiniteRepeatable(tween(2000), RepeatMode.Reverse),
        label = "pulse"
    )

    LaunchedEffect(Unit) {
        Log.d("SplashScreen", "BOOT: Starting premium sequence")
        
        val nextRoute = com.vehicletrackingapp.navigation.Routes.DRIVER_LOGIN

        launch {
            scale.animateTo(1.05f, animationSpec = tween(1200, easing = FastOutSlowInEasing))
            scale.animateTo(1f, animationSpec = spring(dampingRatio = 0.5f, stiffness = Spring.StiffnessLow))
        }
        delay(2500)
        Log.d("SplashScreen", "BOOT: Navigating to $nextRoute")
        onFinished(nextRoute)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(BrandYellow, BrandLightYellow, BrandWhite))),
        contentAlignment = Alignment.Center
    ) {
        // High-Stability "Sync" Pulse
        Box(
            modifier = Modifier
                .size(300.dp)
                .graphicsLayer { scaleX = pulseScale; scaleY = pulseScale }
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        listOf(BrandYellow.copy(alpha = 0.08f), Color.Transparent)
                    )
                )
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp).graphicsLayer { 
                scaleX = scale.value
                scaleY = scale.value
            }
        ) {
            Image(
                painter = painterResource(id = R.drawable.logo),
                contentDescription = "Smart Fleet Logo",
                modifier = Modifier.size(200.dp).shineEffect(),
                contentScale = ContentScale.Fit
            )
            Spacer(modifier = Modifier.height(44.dp))
            
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "OHM MURGA TRADERS",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Black,
                    color = BrandDark,
                    letterSpacing = 6.sp
                )
                Text(
                    text = "SMART FLEET",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Black,
                    color = BrandDark,
                    letterSpacing = 3.sp
                )
                Spacer(modifier = Modifier.height(14.dp))
                Text(
                    text = stringResource(R.string.tagline).uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = BrandGrey,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.5.sp
                )
            }
            
            Spacer(modifier = Modifier.height(100.dp))
            
            Text(
                "SYSTEM CORE ACTIVE", 
                style = MaterialTheme.typography.labelSmall, 
                fontWeight = FontWeight.Black, 
                color = BrandDark.copy(alpha = 0.5f),
                letterSpacing = 3.sp
            )
        }
    }
}
