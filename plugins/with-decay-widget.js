const { withAndroidManifest, withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PKG = 'com.decay.widget';
const XMLNS = 'http://schemas.android.com/apk/res/android';

const KOTLIN_PROVIDER = `package ${PKG}

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.widget.RemoteViews

/**
 * A window onto the companion, with no words in it at all. It mirrors whatever
 * stage the app last reported and then ages on its own between updates, so the
 * home screen never needs the app to be open.
 */
class DecayWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) render(context, appWidgetManager, id)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH) renderAll(context)
    }

    companion object {
        const val PREFS = "decay_widget"
        const val KEY_STAGE = "stage"
        const val ACTION_REFRESH = "${PKG}.REFRESH"

        private val CORE = intArrayOf(
            0xFFFFF7E8.toInt(), 0xFFF6E9D8.toInt(), 0xFFE8E9E6.toInt(),
            0xFFD5DEE4.toInt(), 0xFFDCD4EA.toInt(), 0xFFB8B2C4.toInt()
        )

        private val GLOW = intArrayOf(
            0xFFE8C888.toInt(), 0xFFD8C1A2.toInt(), 0xFFB3B9B6.toInt(),
            0xFF8FA3B0.toInt(), 0xFFA594C4.toInt(), 0xFF7A7488.toInt()
        )

        private val ALPHA = floatArrayOf(1.0f, 0.88f, 0.70f, 0.55f, 0.34f, 0.12f)

        private val SCALE = floatArrayOf(1.0f, 0.97f, 0.93f, 0.88f, 0.80f, 0.72f)

        fun readStage(context: Context): Int =
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt(KEY_STAGE, 0)
                .coerceIn(0, 5)

        fun renderAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context) ?: return
            val ids = manager.getAppWidgetIds(
                android.content.ComponentName(context, DecayWidgetProvider::class.java)
            )
            for (id in ids) render(context, manager, id)
        }

        private fun render(context: Context, manager: AppWidgetManager, id: Int) {
            // Graceful fallback: never blank/broken; default to last known good stage
            val stage = try { readStage(context) } catch (e: Exception) { 0 }
            try {
                val views = RemoteViews(context.packageName, R.layout.decay_widget)

            val glow = GLOW[stage]
            val core = CORE[stage]

            // A little unsteady once there is barely anything left to hold on to.
            val tremble = if (stage >= 4) 0.72f + Math.random().toFloat() * 0.28f else 1.0f

            views.setInt(R.id.decay_widget_bloom, "setColorFilter", glow)
            views.setFloat(R.id.decay_widget_bloom, "setAlpha", 0.62f * ALPHA[stage] * tremble)
            views.setInt(R.id.decay_widget_core, "setColorFilter", core)
            views.setFloat(R.id.decay_widget_core, "setAlpha", 0.96f * ALPHA[stage] * tremble)
            views.setFloat(R.id.decay_widget_core, "setScaleX", SCALE[stage])
            views.setFloat(R.id.decay_widget_core, "setScaleY", SCALE[stage])

            manager.updateAppWidget(id, views)
            } catch (e: Exception) {
                // Fallback: keep existing widget state rather than showing broken/blank
            }
        }
    }
}
`;

const KOTLIN_WORKER = `package ${PKG}

import android.content.Context
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class DecayWidgetWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        DecayWidgetProvider.renderAll(applicationContext)
        return Result.success()
    }
    companion object {
        fun schedule(context: Context) {
            val work = PeriodicWorkRequestBuilder<DecayWidgetWorker>(30, TimeUnit.MINUTES).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "decay_widget_refresh", androidx.work.ExistingPeriodicWorkPolicy.KEEP, work
            )
        }
    }
}`;

const KOTLIN_MODULE = `package ${PKG}

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** Lets the JavaScript layer tell the home screen what the light looks like now. */
class DecayWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DecayWidget"

    @ReactMethod
    fun setStage(stage: Int) {
        val context: Context = reactApplicationContext
        val clamped = stage.coerceIn(0, 5)
        context.getSharedPreferences(DecayWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putInt(DecayWidgetProvider.KEY_STAGE, clamped)
            .apply()
        DecayWidgetProvider.renderAll(context)
        // Schedule periodic refresh ~30 min for Doze resilience
        DecayWidgetWorker.schedule(context)
    }

    @ReactMethod
    fun refresh() {
        val context: Context = reactApplicationContext
        context.sendBroadcast(
            Intent(context, DecayWidgetProvider::class.java).setAction(DecayWidgetProvider.ACTION_REFRESH)
        )
    }
}
`;

const KOTLIN_PACKAGE = `package ${PKG}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class DecayWidgetPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(DecayWidgetModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
`;

const DRAWABLE_FIELD = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="${XMLNS}" android:shape="oval">
    <gradient
        android:type="radial"
        android:centerX="0.5"
        android:centerY="0.5"
        android:gradientRadius="120dp"
        android:startColor="#B30B0D12"
        android:centerColor="#590B0D12"
        android:endColor="#000B0D12" />
</shape>
`;

const DRAWABLE_BLOOM = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="${XMLNS}" android:shape="oval">
    <gradient
        android:type="radial"
        android:centerX="0.5"
        android:centerY="0.5"
        android:gradientRadius="96dp"
        android:startColor="#FFFFFFFF"
        android:centerColor="#7AFFFFFF"
        android:endColor="#00FFFFFF" />
</shape>
`;

const DRAWABLE_CORE = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="${XMLNS}" android:shape="oval">
    <gradient
        android:type="radial"
        android:centerX="0.5"
        android:centerY="0.5"
        android:gradientRadius="48dp"
        android:startColor="#FFFFFFFF"
        android:centerColor="#B8FFFFFF"
        android:endColor="#00FFFFFF" />
</shape>
`;

const LAYOUT = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="${XMLNS}"
    android:id="@+id/decay_widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="12dp">

    <View
        android:id="@+id/decay_widget_field"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:layout_gravity="center"
        android:background="@drawable/decay_widget_field" />

    <View
        android:id="@+id/decay_widget_bloom"
        android:layout_width="196dp"
        android:layout_height="196dp"
        android:layout_gravity="center"
        android:background="@drawable/decay_widget_bloom" />

    <View
        android:id="@+id/decay_widget_core"
        android:layout_width="98dp"
        android:layout_height="98dp"
        android:layout_gravity="center"
        android:background="@drawable/decay_widget_core" />
</FrameLayout>
`;

const PROVIDER_INFO = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="${XMLNS}"
    android:initialLayout="@layout/decay_widget"
    android:minWidth="110dp"
    android:minHeight="110dp"
    android:previewLayout="@layout/decay_widget"
    android:resizeMode="horizontal|vertical"
    android:updatePeriodMillis="1800000"
    android:widgetCategory="home_screen" />
`;

function writeFile(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function withDecayWidgetFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const root = cfg.modRequest.platformProjectRoot;
      const javaDir = path.join('app', 'src', 'main', 'java', ...PKG.split('.'));
      const resDir = path.join('app', 'src', 'main', 'res');

      writeFile(root, path.join(javaDir, 'DecayWidgetProvider.kt'), KOTLIN_PROVIDER);
      writeFile(root, path.join(javaDir, 'DecayWidgetModule.kt'), KOTLIN_MODULE);
      writeFile(root, path.join(javaDir, 'DecayWidgetWorker.kt'), KOTLIN_WORKER);
      writeFile(root, path.join(javaDir, 'DecayWidgetPackage.kt'), KOTLIN_PACKAGE);
      writeFile(root, path.join(resDir, 'layout', 'decay_widget.xml'), LAYOUT);
      writeFile(root, path.join(resDir, 'xml', 'decay_widget_info.xml'), PROVIDER_INFO);
      writeFile(root, path.join(resDir, 'drawable', 'decay_widget_field.xml'), DRAWABLE_FIELD);
      writeFile(root, path.join(resDir, 'drawable', 'decay_widget_bloom.xml'), DRAWABLE_BLOOM);
      writeFile(root, path.join(resDir, 'drawable', 'decay_widget_core.xml'), DRAWABLE_CORE);

      return cfg;
    },
  ]);
}

function withDecayWidgetManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    const already = (app.receiver || []).some(
      (r) => r.$?.['android:name'] === `${PKG}.DecayWidgetProvider`,
    );
    if (already) return cfg;
    app.receiver = app.receiver || [];
    app.receiver.push({
      $: {
        'android:name': `${PKG}.DecayWidgetProvider`,
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/decay_widget_info',
          },
        },
      ],
    });
    return cfg;
  });
}

function withDecayWidgetRegistration(config) {
  return withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (contents.includes(`${PKG}.DecayWidgetPackage`)) return cfg;

    const importLine = `import ${PKG}.DecayWidgetPackage`;
    if (/^import /m.test(contents)) {
      contents = contents.replace(/^import /m, `${importLine}\nimport `);
    } else {
      contents = `${importLine}\n${contents}`;
    }

    if (/PackageList\(this\)\.packages\.apply\s*\{/.test(contents)) {
      contents = contents.replace(
        /(PackageList\(this\)\.packages\.apply\s*\{)/,
        `$1\n        add(DecayWidgetPackage())`,
      );
    } else {
      contents = contents.replace(
        /return\s+packages/,
        'packages.add(DecayWidgetPackage())\n    return packages',
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

/** @type {import('@expo/config-plugins').ConfigPlugin} */
module.exports = function withDecayWidget(config) {
  let next = withDecayWidgetManifest(config);
  next = withDecayWidgetFiles(next);
  next = withDecayWidgetRegistration(next);
  return next;
};
