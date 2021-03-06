import React from "react";
import CustomSnackbar from './CustomSnackbar';
import { Box, Dialog, Typography, Avatar, Button, TextField, Grid, Container } from "@material-ui/core";
import GroupIcon from '@material-ui/icons/Group';

const styles = {
  dialogContainer:{
    minWidth: "400px"
  },
  avatar: {
    backgroundColor: "#009688",
    margin: "auto",
    marginTop: "20px"
  },
  button: {
    margin: "24px 0 16px",
    backgroundColor: "#009688",
    color: "#fff",
  },
  buttonContainer: {
    width: "100%"
  }
};

class CourseForm extends React.Component {
  constructor(props) {
    super(props);
    this.doCreate = this.doCreate.bind(this);
    this.courseName = React.createRef();
    this.state = {
      openSnackbar: false,
			msgSnackbar: ""
    };

    this.handleCloseSnackbar = this.handleCloseSnackbar.bind(this)
  }
  
  handleCloseSnackbar(){
		this.setState({
			openSnackbar: false,
			msgSnackbar: "",
		})
	}

  async doCreate() {
    this.setState({
      buttonDisabled: true,
    });
    const name = this.courseName.current.value;
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "name": name
        })
      };
      let response = await fetch("/api/courses/create", requestOptions);
      if(response.status === 200){
        this.props.closeForm(true);
      }
      else{
        this.setState({
          openSnackbar: true,
          msgSnackbar: "Error in course creation",
        })
      }
    } 
    catch (err) {
      console.log(err);
      this.setState({
        openSnackbar: true,
        msgSnackbar: "An error occurred",
      })
    }
  }

  render() {
    return (
      <div>
        <CustomSnackbar open={this.state.openSnackbar} msg={this.state.msgSnackbar} severity="error" closeSnackbar={this.handleCloseSnackbar}/>

        <Dialog open={this.props.open} onClose={this.props.closeForm} aria-labelledby="form-dialog-title">
          <Container fixed style={styles.dialogContainer} >
            <Box>
              <Avatar style={styles.avatar} align="center">
                <GroupIcon />
              </Avatar>
            </Box>

            <Typography component="h1" variant="h5" align="center">
              Create a Course
            </Typography>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              inputRef={this.courseName}
              id="courseName"
              label="courseName"
              name="courseName"
              autoComplete="courseName"
              autoFocus
            />
            <Grid container>
              <Grid item style={styles.buttonContainer}>
                <Button
                  onClick={this.doCreate}
                  fullWidth
                  variant="contained"
                  style={styles.button}
                >
                  Create
                </Button>
              </Grid>
            </Grid>
          </Container>
        </Dialog>
      </div>
    );
  }
}

export default CourseForm;
