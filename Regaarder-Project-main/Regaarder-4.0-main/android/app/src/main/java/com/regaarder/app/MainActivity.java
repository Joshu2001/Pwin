package com.regaarder.app;

import android.app.PendingIntent;
import android.app.PictureInPictureParams;
import android.app.RemoteAction;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.util.Rational;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {

	private static final String TAG = "MainActivity";
	private static final String ACTION_PIP_TOGGLE = "com.regaarder.app.PIP_TOGGLE_PLAY";
	private BroadcastReceiver pipActionReceiver;
	private volatile boolean currentlyPlaying = true;

	/**
	 * Direct JavaScript interface for PiP — bypasses Capacitor plugin layer.
	 * Exposed to JS as  window.NativePiP.enterPiP()  /  window.NativePiP.setPipAllowed(true)
	 */
	private class NativePiPBridge {
		@JavascriptInterface
		public void enterPiP() {
			Log.d(TAG, "[NativePiP] enterPiP called from JS");
			runOnUiThread(() -> {
				try {
					if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
						Log.w(TAG, "[NativePiP] PiP requires Android 8+");
						return;
					}

					PictureInPictureParams params = buildPipParams();
					setPictureInPictureParams(params);
					boolean ok = enterPictureInPictureMode(params);
					Log.d(TAG, "[NativePiP] enterPictureInPictureMode => " + ok);

					// Delay moveTaskToBack so the CSS paint from JS completes first.
					// Some OEMs (Xiaomi, Samsung) need the activity to lose foreground
					// for the PiP window to visually appear.
					if (ok) {
						new Handler(Looper.getMainLooper()).postDelayed(() -> {
							try { moveTaskToBack(false); } catch (Exception ignored) {}
						}, 150);
					}
				} catch (Exception e) {
					Log.e(TAG, "[NativePiP] enterPiP failed", e);
				}
			});
		}

		@JavascriptInterface
		public void setPipAllowed(boolean allowed) {
			Log.d(TAG, "[NativePiP] setPipAllowed: " + allowed);
			PiPPlugin.setAllowed(allowed);
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
				runOnUiThread(() -> {
					try {
						setPictureInPictureParams(buildPipParams());
					} catch (Exception e) {
						Log.w(TAG, "setPictureInPictureParams failed", e);
					}
				});
			}
		}

		@JavascriptInterface
		public void updatePlayState(boolean playing) {
			Log.d(TAG, "[NativePiP] updatePlayState: " + playing);
			currentlyPlaying = playing;
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isInPictureInPictureMode()) {
				runOnUiThread(() -> {
					try { setPictureInPictureParams(buildPipParams()); } catch (Exception e) {}
				});
			}
		}

		@JavascriptInterface
		public boolean isSupported() {
			return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
		}
	}

	/** Build PiP params with native play/pause RemoteAction and auto-enter flag. */
	private PictureInPictureParams buildPipParams() {
		PictureInPictureParams.Builder b = new PictureInPictureParams.Builder()
				.setAspectRatio(new Rational(16, 9));

		// Native play/pause toggle button rendered by Android in the PiP window
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			try {
				ArrayList<RemoteAction> actions = new ArrayList<>();
				int iconRes = currentlyPlaying
						? android.R.drawable.ic_media_pause
						: android.R.drawable.ic_media_play;
				String label = currentlyPlaying ? "Pause" : "Play";
				Icon icon = Icon.createWithResource(this, iconRes);
				Intent toggleIntent = new Intent(ACTION_PIP_TOGGLE);
				toggleIntent.setPackage(getPackageName());
				PendingIntent pi = PendingIntent.getBroadcast(
						this, 0,
						toggleIntent,
						PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
				RemoteAction toggle = new RemoteAction(icon, label, "Toggle playback", pi);
				actions.add(toggle);
				b.setActions(actions);
			} catch (Exception e) {
				Log.w(TAG, "Failed to add PiP RemoteAction", e);
			}
		}

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
			b.setAutoEnterEnabled(PiPPlugin.isPipAllowed());
		}

		return b.build();
	}

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		// Register plugins so videoplayer can call setImmersive / PiP when needed
		registerPlugin(ImmersiveModePlugin.class);
		registerPlugin(PiPPlugin.class);

		// Inject direct JS interface for PiP (most reliable native bridge)
		try {
			WebView wv = getBridge().getWebView();
			if (wv != null) {
				wv.addJavascriptInterface(new NativePiPBridge(), "NativePiP");
				Log.d(TAG, "NativePiP JS interface injected");
			}
		} catch (Exception e) {
			Log.w(TAG, "Failed to inject NativePiP JS interface", e);
		}

		// Register receiver for native PiP play/pause RemoteAction
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			pipActionReceiver = new BroadcastReceiver() {
				@Override
				public void onReceive(Context context, Intent intent) {
					if (ACTION_PIP_TOGGLE.equals(intent.getAction())) {
						// Toggle state and rebuild PiP params with new icon
						currentlyPlaying = !currentlyPlaying;
						if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
							try { setPictureInPictureParams(buildPipParams()); } catch (Exception e) {}
						}
						// Tell WebView to toggle playback — pass desired state so JS doesn't need stale closures
						WebView wv = getBridge() != null ? getBridge().getWebView() : null;
						if (wv != null) {
							String js = "window.dispatchEvent(new CustomEvent('pipTogglePlay',{detail:{play:" + currentlyPlaying + "}}));";
							wv.evaluateJavascript(js, null);
						}
					}
				}
			};
			IntentFilter filter = new IntentFilter(ACTION_PIP_TOGGLE);
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
				registerReceiver(pipActionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
			} else {
				registerReceiver(pipActionReceiver, filter);
			}
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
	public void onDestroy() {
		super.onDestroy();
		if (pipActionReceiver != null) {
			try { unregisterReceiver(pipActionReceiver); } catch (Exception e) {}
		}
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);
		if (hasFocus && ImmersiveModePlugin.isImmersiveEnabled()) {
			ImmersiveModePlugin.applyImmersiveStatic(this, true);
		}
	}

	/* ── Picture-in-Picture support ── */

	@Override
	public void onUserLeaveHint() {
		super.onUserLeaveHint();
		if (!PiPPlugin.isPipAllowed() || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
		// Android 12+: setAutoEnterEnabled handles smooth PiP transition automatically
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) return;
		// Android 8–11: enter PiP on Home press; CSS @media query handles UI hiding
		try {
			enterPictureInPictureMode(buildPipParams());
		} catch (Exception e) {
			// Device may not support PiP
		}
	}

	@Override
	public void onPictureInPictureModeChanged(boolean isInPipMode, Configuration newConfig) {
		super.onPictureInPictureModeChanged(isInPipMode, newConfig);
		// Notify the WebView so JS can react (hide/show controls, etc.)
		if (getBridge() != null && getBridge().getWebView() != null) {
			String js = "window.dispatchEvent(new CustomEvent('pipModeChanged',{detail:{pip:" + isInPipMode + "}}));";
			getBridge().getWebView().evaluateJavascript(js, null);
		}
	}
}
