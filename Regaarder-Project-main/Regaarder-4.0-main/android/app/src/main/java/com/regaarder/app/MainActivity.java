package com.regaarder.app;

import android.app.PictureInPictureParams;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

	private static final String TAG = "MainActivity";

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		// Register plugins
		registerPlugin(ImmersiveModePlugin.class);
		registerPlugin(PiPPlugin.class);

		// Inject NativePiP JS bridge (direct path, most reliable)
		try {
			WebView webView = getBridge().getWebView();
			webView.addJavascriptInterface(new NativePiPBridge(), "NativePiP");
		} catch (Exception e) {
			Log.w(TAG, "Failed to add NativePiP JS interface", e);
		}
		
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

	/** Auto-enter PiP when user presses Home while videoplayer is active */
	@Override
	public void onUserLeaveHint() {
		super.onUserLeaveHint();
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && PiPPlugin.isPipAllowed()) {
			if (isFinishing() || (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1 && isDestroyed())) {
				Log.w(TAG, "onUserLeaveHint: Activity is not available for PiP");
				return;
			}
			
			try {
				PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder()
						.setAspectRatio(new Rational(16, 9));
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
					builder.setAutoEnterEnabled(true);
					builder.setSeamlessResizeEnabled(true);
				}
				
				boolean entered = enterPictureInPictureMode(builder.build());
				if (entered) {
					Log.d(TAG, "Auto-entered PiP on Home press");
				} else {
					Log.w(TAG, "Auto-PiP: enterPictureInPictureMode returned false");
				}
			} catch (IllegalStateException e) {
				Log.w(TAG, "Auto-PiP: Activity not in resumed state", e);
			} catch (Exception e) {
				Log.e(TAG, "Auto-PiP failed", e);
			}
		}
	}

	/** Dispatch PiP mode changes to JS */
	@Override
	public void onPictureInPictureModeChanged(boolean isInPiP, Configuration newConfig) {
		super.onPictureInPictureModeChanged(isInPiP, newConfig);
		Log.d(TAG, "onPictureInPictureModeChanged: " + isInPiP);
		
		try {
			WebView webView = getBridge().getWebView();
			if (webView != null) {
				String js = "javascript:window.dispatchEvent(new CustomEvent('pipModeChanged',{detail:{pip:" + isInPiP + "}}))";
				webView.post(() -> {
					try {
						webView.evaluateJavascript(js, result -> {
							if (result == null) {
								Log.d(TAG, "pipModeChanged event dispatched successfully");
							}
						});
					} catch (Exception e) {
						Log.e(TAG, "Failed to evaluate JavaScript for PiP event", e);
					}
				});
			}
		} catch (Exception e) {
			Log.w(TAG, "Failed to dispatch pipModeChanged event", e);
		}
	}

	/** Direct JS interface for PiP — accessed via window.NativePiP */
	public class NativePiPBridge {
		@JavascriptInterface
		public void enterPiP() {
			if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
				Log.w(TAG, "NativePiPBridge: enterPiP requires Android 8.0+");
				return;
			}
			
			runOnUiThread(() -> {
				try {
					if (isFinishing() || isDestroyed()) {
						Log.w(TAG, "NativePiPBridge: Activity is finishing or destroyed");
						return;
					}
					
					PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder()
							.setAspectRatio(new Rational(16, 9));
					
					if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
						builder.setAutoEnterEnabled(true);
						// Android 12+: set minimum size for PiP
						builder.setSeamlessResizeEnabled(true);
					}
					
					boolean entered = enterPictureInPictureMode(builder.build());
					Log.d(TAG, "NativePiPBridge: enterPictureInPictureMode returned " + entered);
				} catch (Exception e) {
					Log.e(TAG, "NativePiPBridge: enterPiP failed", e);
				}
			});
		}

		@JavascriptInterface
		public void setPipAllowed(boolean allowed) {
			PiPPlugin.setAllowed(allowed);
			Log.d(TAG, "NativePiPBridge: setPipAllowed=" + allowed);
			
			// Also update native params if Android 12+
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !isFinishing() && !isDestroyed()) {
				runOnUiThread(() -> {
					try {
						PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder()
								.setAspectRatio(new Rational(16, 9))
								.setAutoEnterEnabled(allowed)
								.setSeamlessResizeEnabled(true);
						setPictureInPictureParams(builder.build());
					} catch (Exception e) {
						Log.w(TAG, "NativePiPBridge: Failed to update PiP params", e);
					}
				});
			}
		}
		
		@JavascriptInterface
		public boolean isSupported() {
			return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
		}
	}
}