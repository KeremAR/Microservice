package com.campus.userservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Define exchange name as a constant for consistency
    public static final String EXCHANGE_NAME = "campus_events_exchange";

    // Define routing key for user profile updates
    public static final String ROUTING_KEY_USER_UPDATED = "user.profile.updated";

    @Bean
    public TopicExchange exchange() {
        // durable=true: Exchange survives RabbitMQ restarts
        // autoDelete=false: Exchange is not deleted when last queue is unbound
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        // Use Jackson for converting messages to JSON
        return new Jackson2JsonMessageConverter();
    }

    // Example Queue and Binding (Uncomment and adapt if this service needs to listen to events)
    /*
    public static final String QUEUE_NAME_EXAMPLE = "user_service_some_queue";
    public static final String ROUTING_KEY_PATTERN_EXAMPLE = "some.event.#"; // Example pattern

    @Bean
    Queue exampleQueue() {
        // durable=true: Queue survives RabbitMQ restarts
        return new Queue(QUEUE_NAME_EXAMPLE, true);
    }

    @Bean
    Binding exampleBinding(Queue exampleQueue, TopicExchange exchange) {
        return BindingBuilder.bind(exampleQueue).to(exchange).with(ROUTING_KEY_PATTERN_EXAMPLE);
    }
    */
} 