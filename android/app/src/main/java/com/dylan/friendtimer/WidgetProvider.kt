package com.dylan.friendtimer
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
// import com.reactnativemmkv.MMKV

class WidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
    ) {
        // MMKV.initialize(context)
        for (appWidgetId in appWidgetIds) {
        updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
}

// It's good practice to create a helper function for the update logic
private fun updateAppWidget(
context: Context,
appWidgetManager: AppWidgetManager,
appWidgetId: Int
) {

}