package com.resumeai.util;

import com.resumeai.exception.InvalidReorderException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReorderSupportTest {

    private record Item(UUID id) {}

    @Test
    void reorder_returnsItemsInTheRequestedOrder() {
        Item a = new Item(UUID.randomUUID());
        Item b = new Item(UUID.randomUUID());
        Item c = new Item(UUID.randomUUID());

        List<Item> result = ReorderSupport.reorder(List.of(a, b, c), List.of(c.id(), a.id(), b.id()), Item::id);

        assertThat(result).containsExactly(c, a, b);
    }

    @Test
    void reorder_throwsWhenAnIdIsMissing() {
        Item a = new Item(UUID.randomUUID());
        Item b = new Item(UUID.randomUUID());

        assertThatThrownBy(() -> ReorderSupport.reorder(List.of(a, b), List.of(a.id()), Item::id))
            .isInstanceOf(InvalidReorderException.class);
    }

    @Test
    void reorder_throwsWhenAnIdIsDuplicated() {
        Item a = new Item(UUID.randomUUID());
        Item b = new Item(UUID.randomUUID());

        assertThatThrownBy(() -> ReorderSupport.reorder(List.of(a, b), List.of(a.id(), a.id()), Item::id))
            .isInstanceOf(InvalidReorderException.class);
    }

    @Test
    void reorder_throwsWhenAnIdDoesNotBelongToTheExistingSet() {
        Item a = new Item(UUID.randomUUID());
        UUID foreignId = UUID.randomUUID();

        assertThatThrownBy(() -> ReorderSupport.reorder(List.of(a), List.of(foreignId), Item::id))
            .isInstanceOf(InvalidReorderException.class);
    }

    @Test
    void reorder_isANoOpOrderingWhenAlreadyInOrder() {
        Item a = new Item(UUID.randomUUID());
        Item b = new Item(UUID.randomUUID());

        List<Item> result = ReorderSupport.reorder(List.of(a, b), List.of(a.id(), b.id()), Item::id);

        assertThat(result).containsExactly(a, b);
    }
}
