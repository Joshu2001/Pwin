package com.regaarder.app;

import android.graphics.Color;
import android.app.Activity;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ImmersiveMode")
public class ImmersiveModePlugin extends Plugin {
	private static volatile boolean immersiveEnabled = false;
	private static volatile boolean listenerAttached = false;

	public static boolean isImmersiveEnabled() {
		return immersiveEnabled;
	}

	public static void applyImmersiveStatic(Activity activity, boolean enabled) {
		if (activity == null) {
			return;
		}
		activity.runOnUiThread(() -> applyImmersive(activity, enabled));
	}

	private static void applyImmersive(Activity activity, boolean enabled) {
		try {
			Window window = activity.getWindow();
			View decor = window.getDecorView();

			if (enabled) {
				// ===== IMMERSIVE MODE ON =====
				// Use both modern and legacy flags for maximum compatibility
				// Ensure bars are black if they briefly appear
				window.setStatusBarColor(Color.BLACK);
				window.setNavigationBarColor(Color.BLACK);
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
					window.setNavigationBarContrastEnforced(false);
				}

				// Legacy flags (works on most devices including Xiaomi/HyperOS)
				int flags = View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
						| View.SYSTEM_UI_FLAG_LAYOUT_STABLE
						| View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
						| View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
						| View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
						| View.SYSTEM_UI_FLAG_FULLSCREEN;
				decor.setSystemUiVisibility(flags);

				// Window flags
				window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
				window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);

				// Modern API for Android 11+
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
					WindowCompat.setDecorFitsSystemWindows(window, false);
					WindowInsetsController controller = window.getInsetsController();
					if (controller != null) {
						controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
						controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
					}
				}

				// Re-apply if the system UI becomes visible (OEMs often force it)
				if (!listenerAttached) {
					decor.setOnSystemUiVisibilityChangeListener(visibility -> {
						if (immersiveEnabled) {
							boolean navVisible = (visibility & View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) == 0;
							boolean statusVisible = (visibility & View.SYSTEM_UI_FLAG_FULLSCREEN) == 0;
							if (navVisible || statusVisible) {
								applyImmersive(activity, true);
							}
						}
					});
					listenerAttached = true;
				}
			} else {
				// ===== IMMERSIVE MODE OFF =====
				int black = Color.parseColor("#000000");
				int white = Color.parseColor("#FFFFFF");

				// Clear window flags first
				window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
				window.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);

				// Legacy: restore visible system UI
				int flags = View.SYSTEM_UI_FLAG_VISIBLE;
				decor.setSystemUiVisibility(flags);

				// Restore standard bars (black status, white navigation)
				window.setStatusBarColor(black);
				window.setNavigationBarColor(white);

				// Modern API for Android 11+
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
					WindowCompat.setDecorFitsSystemWindows(window, true);
					WindowInsetsController controller = window.getInsetsController();
					if (controller != null) {
						controller.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
						// Status: light icons on black. Navigation: dark icons on white.
						controller.setSystemBarsAppearance(
							WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
							WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS |
							WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
						);
					}
				}
			}
		} catch (Exception ignored) {
			// ignore errors
		}
	}

	@PluginMethod
	public void setImmersive(PluginCall call) {
		Boolean enabled = call.getBoolean("enabled", false);
		immersiveEnabled = enabled != null && enabled;
		applyImmersiveStatic(getActivity(), immersiveEnabled);
		call.resolve();
	}
}
