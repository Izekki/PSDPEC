package com.champico;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.layout.Pane;
import javafx.stage.Stage;

public class Main extends Application{
    public static void main(String[] args) {
        launch(args);
    }

    public void start(Stage primaryStage) {
        try{
            Pane root = FXMLLoader.load(getClass().getResource("/GUI/FXML/mainScreen.fxml"));
            Scene scene = new Scene(root);

            primaryStage.setScene(scene);

            primaryStage.setMinWidth(400);  // Ancho mínimo
            primaryStage.setMinHeight(400); // Alto mínimo

            primaryStage.show();
        }catch (Exception e){
            e.printStackTrace();
        }
    }
}