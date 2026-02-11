package com.regaarder.app;

import android.app.Activity;
import android.app.PictureInPictureParams;
import android.os.Build;
import android.util.Log;
import android.util.Rational;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

/**
 * Capacitor plugin that allows JavaScript to request native Android
 * Picture-in-Picture mode and control whether auto-PiP is enabled.
 *
 * JS usage:
 *   Cap.Plugins.PiPMode.enterPiP({ width: 16, height: 9 })
 *   Cap.Plugins.PiPMode.setPipAllowed({ allowed: true })
 *   Cap.Plugins.PiPMode.isSupported()
 */
@CapacitorPlugin(name = "PiPMode")
public class PiPPlugin extends Plugin {

	private static final String TAG = "PiPPlugin";

	/**
	 * Static flag — checked by MainActivity.onUserLeaveHint() to decide
	 * whether pressing Home should auto-enter PiP.
	 * Only true while the videoplayer page is mounted.
	 */
	private static volatile boolean pipAllowed = false;

	public static boolean isPipAllowed() {
		return pipAllowed;
	}

	/** Called by NativePiPBridge (direct JS interface) to update the flag. */
	public static void setAllowed(boolean allowed) {
		pipAllowed = allowed;
		Log.d(TAG, "setAllowed (static): " + allowed);
	}

	/* ── JS-callable methods ── */

	/** Enter PiP mode immediately (called from the PiP button). */
	@PluginMethod
	public void enterPiP(PluginCall call) {
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
			call.reject("PiP requires Android 8.0+");
			return;
		}

		int width  = call.getInt("width", 16);
		int height = call.getInt("height", 9);

		// CRITICAL: enterPictureInPictureMode MUST run on the UI thread.
		// Capacitor plugin methods execute on a background executor by default.
		Activity activity = getActivity();
		if (activity == null || activity.isFinishing()) {
			call.reject("Activity not available");
			return;
		}

		// Resolve IMMEDIATELY so the JS await doesn't hang.
		// The actual PiP entry is fire-and-forget on the UI thread.
		call.resolve();

		activity.runOnUiThread(() -> {
			try {
				PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder()
						.setAspectRatio(new Rational(width, height));

				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
					builder.setAutoEnterEnabled(true);
				}

				boolean entered = activity.enterPictureInPictureMode(builder.build());
				Log.d(TAG, "enterPictureInPictureMode returned: " + entered);
			} catch (Exception e) {
				Log.e(TAG, "Failed to enter PiP", e);
			}
		});
	}

	/**
	 * Tell the native side whether auto-PiP (on Home press) is allowed.
	 * Videoplayer calls setPipAllowed({allowed:true}) on mount,
	 * and setPipAllowed({allowed:false}) on unmount.
	 */
	@PluginMethod
	public void setPipAllowed(PluginCall call) {
		pipAllowed = Boolean.TRUE.equals(call.getBoolean("allowed", false));
		Log.d(TAG, "setPipAllowed: " + pipAllowed);

		// Android 12+: proactively set auto-enter params on the activity
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
			Activity activity = getActivity();
			if (activity != null && !activity.isFinishing()) {
				activity.runOnUiThread(() -> {
					try {
						PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder()
								.setAspectRatio(new Rational(16, 9))
								.setAutoEnterEnabled(pipAllowed);
						activity.setPictureInPictureParams(builder.build());
					} catch (Exception e) {
						Log.w(TAG, "setPictureInPictureParams failed", e);
					}
				});
			}
		}

		call.resolve();
	}

	@PluginMethod
	public void isSupported(PluginCall call) {
		boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
		JSObject result = new JSObject();
		result.put("supported", supported);
		call.resolve(result);
	}
}
