package com.regaarder.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		// Register plugin so videoplayer can call setImmersive when needed
		registerPlugin(ImmersiveModePlugin.class);
		
		// Set up black status bar and white navigation bar for non-immersive pages
		Window window = getWindow();
		int black = Color.parseColor("#000000");
		int white = Color.parseColor("#FFFFFF");
		
		// Black status bar with light icons
		window.setStatusBarColor(black);
		// White navigation bar with dark icons (matches top navbar color)
		window.setNavigationBarColor(white);
		
		// Status bar: light icons on dark background. Navigation bar: dark icons on light background.
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
			window.getInsetsController().setSystemBarsAppearance(
				android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
				android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS |
				android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
			);
		} else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			View decorView = window.getDecorView();
			int flags = decorView.getSystemUiVisibility();
			flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
			flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
			decorView.setSystemUiVisibility(flags);
		}
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);
		if (hasFocus && ImmersiveModePlugin.isImmersiveEnabled()) {
			ImmersiveModePlugin.applyImmersiveStatic(this, true);
		}
	}
}
