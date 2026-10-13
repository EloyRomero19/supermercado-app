package com.miapp.backend.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.Test;

/** Test unitario: sin Spring ni base de datos, solo la lógica del contador. */
class RateLimiterTests {

	RateLimiter limiter = new RateLimiter();

	@Test
	void allowsUpToTheLimitThenAsksToWait() {
		for (int i = 0; i < 3; i++) {
			assertThat(limiter.tryAcquire("ana", 3, Duration.ofMinutes(1))).isZero();
		}
		assertThat(limiter.tryAcquire("ana", 3, Duration.ofMinutes(1))).isBetween(1L, 60L);
	}

	@Test
	void keysAreIndependent() {
		limiter.tryAcquire("ana", 1, Duration.ofMinutes(1));
		assertThat(limiter.tryAcquire("ana", 1, Duration.ofMinutes(1))).isPositive();
		assertThat(limiter.tryAcquire("beto", 1, Duration.ofMinutes(1))).isZero();
	}

	@Test
	void newWindowStartsAfterTheOldOneExpires() throws InterruptedException {
		limiter.tryAcquire("ana", 1, Duration.ofMillis(50));
		assertThat(limiter.tryAcquire("ana", 1, Duration.ofMillis(50))).isPositive();
		Thread.sleep(60);
		assertThat(limiter.tryAcquire("ana", 1, Duration.ofMillis(50))).isZero();
	}

}
