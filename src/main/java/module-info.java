module com.personalprojects.psdpec {
    requires javafx.controls;
    requires javafx.fxml;


    opens com.personalprojects.psdpec to javafx.fxml;
    exports com.personalprojects.psdpec;
}