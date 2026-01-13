package it.judo1ms.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Hide Status Bar
        android.view.View decorView = getWindow().getDecorView();
        int uiOptions = android.view.View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
        
        // Remember that you should never show the action bar if the
        // status bar is hidden, so hide that too if necessary.
        if (getActionBar() != null) {
            getActionBar().hide();
        }
    }
}
