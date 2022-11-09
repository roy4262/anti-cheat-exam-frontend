import React from "react";
import { useAppSelector } from "../../hooks";
import { useTimer } from "react-timer-hook";
import classes from "./home.module.scss";
import { Button, Container, Stack, Typography } from "@mui/material";
import Image from "next/image";
import GitHubIcon from "@mui/icons-material/GitHub";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";

interface HeroProps {}

const Hero: React.FC<HeroProps> = () => {
  return (
    <React.Fragment>
      <section className={classes.heroSection}>
        {/* <h1>Anti-Cheat Exam App</h1> */}

        <Container>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <div className={classes.heroText}>
              <h1>Online Exam - Made Fairer</h1>

              <p>AI-enabled cheating detection</p>

              <Stack direction="row" className={classes.buttonGroup}>
                <Button
                  startIcon={<GitHubIcon />}
                  variant="contained"
                  size="large"
                  color="primary"
                >
                  Mobile App
                </Button>

                <Button
                  startIcon={<ArrowOutwardIcon />}
                  variant="contained"
                  size="large"
                  color="primary"
                >
                  Login
                </Button>
              </Stack>
            </div>

            <div className={classes.phone}>
              <img
                src="https://demo.bootstraptemple.com/app-landing/img/device-mockups/iPhoneX/portrait.9c7ba108.png"
                alt="Phone"
                // width={500}
                // height={1000}
              />
            </div>
          </Stack>
        </Container>
      </section>
    </React.Fragment>
  );
};

export default Hero;
